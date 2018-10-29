import sys
import os
import requests
import json
import time

def err(msg):
    print("Error: ", msg)
    exit(1)

class Neb(object):
    REGISTER_APIS = [
        "transaction",
        "tx",
        "sendir",
        "create",
        "balance",
        "accounts",
        "check_accounts",
        "smartcontract",
        "method",
        "call"
    ]

    def __init__(self, vendor):
        self.mainnet = "https://mainnet.nebulas.io"
        self.testnet = "https://testnet.nebulas.io"
        self.local = "http://localhost:8685"
        self.vendor = vendor
        self.host = self.local
        if vendor == 'mainnet':
            self.host = self.mainnet
        elif vendor == 'testnet':
            self.host = self.testnet
        elif vendor == 'internal':
            self.host = self.internal
        elif vendor == 'local':
            self.host = self.local
        self.ACCT_FILE_NAME = "accounts.txt"
        self.SC_FILE_NAME = "smart_contracts/smart_contracts.txt"
        self.CMD_RECORD_FILE_NAME = "cmd_history.txt"

    def _load_accounts(self):
        # check existing accounts
        fp = open(self.ACCT_FILE_NAME, "r")
        info = {}
        try:
            lines = fp.readlines()
            for line in lines:
                addr_json = json.loads(line.strip())
                if addr_json['host'] not in info:
                    info[addr_json['host']] = []
                info[addr_json['host']].append({'address': addr_json['address'], 'value': addr_json['value']})     
        except:
            pass
        finally:
            fp.close()
        return info[self.vendor] if self.vendor in info else []

    def _append_accounts_raw(self, addr, value):
        fp = open(self.ACCT_FILE_NAME, "a")
        try:
            account_json = {'address':addr, 'value':value, 'host':self.host}
            fp.write(json.dumps(account_json)+"\n")
        except:
            pass
        finally:
            fp.close()    

    def _append_accounts(self, account):
        fp = open(self.ACCT_FILE_NAME, "a")
        try:
            fp.write(json.dumps(account)+"\n")
        except:
            pass
        finally:
            fp.close()      

    def _check_nonce(self, address):
        url = "%s/v1/user/accountstate"%self.host
        data = {"address":address}
        try:
            res = self.request(url, data)
            return int(res['result']['nonce'])
        except:
            pass
        return -1

    def request(self, url, data, request_mode=2):
        post_headers = {'Accept': 'application/json'}
        get_headers = {'Content-Type': 'application/json'}
        #print("start to send request, with data: ", json.dumps(data))
        if request_mode == 1:
            response = requests.get(url, headers=get_headers, data=json.dumps(data))
        elif request_mode == 2:
            response = requests.post(url, headers=post_headers, data=json.dumps(data))
        return json.loads(response.text)

    def get_register_methods(self):
        return Neb.REGISTER_APIS



    # Accounts related methods
    def check_accounts(self): 
        accounts = self._load_accounts()
        for account in accounts:
            print(account['address'] + ": " + account['value'])

    def balance(self, address):
        #cmd = "curl -i -H Accept:application/json -X POST %s/v1/user/accountstate -d '{\"address\":\"%s\"}'"%(self.host, address)
        url = "%s/v1/user/accountstate"%self.host
        data = {"address":address}
        res = self.request(url, data)
        balance = float(res['result']['balance'])
        print("Address: " + address + ", Balance: " + str(balance/pow(10, 18))
            + " NAS, " + "nonce: " + str(res['result']['nonce']) + ", type: " + str(res['result']['type']) + "\n")
        return balance

    def create_account(self, passphrase):
        url = '%s/v1/admin/account/new'%self.host
        data = {"passphrase":passphrase}
        res = self.request(url, data)
        res['result']['value'] = '0'
        res['result']['host'] = self.host
        self._append_accounts(res['result'])
        print("Created a new account: %s"%res['result']['address'])

    def show_accounts(self, curl=True):
        if curl:
            cmd = "curl -i -H Accept:application/json -X GET %s/v1/admin/accounts"%self.host
            os.system(cmd)
        else:
            url = '%s/v1/admin/accounts'%self.host
            res = self.request(url, {}, 1)
            print("Found following acccounts:\n")
            print(res)
            for addr in res['result']['addresses']:
                print(addr)


    # Transactions related methods
    def _sign_tx(self, data):
        url = '%s/v1/admin/sign'%self.host
        res = self.request(url, data)
        return res['result']

    def _update_sc_addr(self, sc_name, addr):
        fp = open(self.SC_FILE_NAME, "a")
        try:
            info = {"name":sc_name, "addr":addr}
            fp.write(json.dumps(info))
            fp.write("\n")
        except:
            pass
        finally:
            fp.close()

    def _get_contract_address(self, contract_name):
        fp = open(self.SC_FILE_NAME, "r")
        res_addr = None
        try:
            lines = fp.readlines()
            for line in lines:
                info = json.loads(line.strip())
                if info['name'] == contract_name:
                    res_addr = info['addr']
        except:
            pass
        finally:
            fp.close()
        return res_addr

    def _base_transaction(self, from_addr, to_addr, value, data, tx_type=None):
        # sign the tx, then send the raw data
        url = '%s/v1/user/rawtransaction'%self.host

        # check nonce
        ex_nonce = self._check_nonce(from_addr)
        if ex_nonce < 0:
            err("failed to check from address nonce")
        nonce = ex_nonce + 1

        # check balance
        balance = self.balance(from_addr)
        #TODO, calculate the gas here
        if balance <= 0.0:
            err("Insufficient balance!")

        gas_price = '1000000'
        gas_limit = '2000000'

        data["transaction"]["nonce"] = nonce
        data["transaction"]["gasPrice"] = gas_price
        data["transaction"]["gasLimit"] = gas_limit
        data["transaction"]["from"] = from_addr
        data["transaction"]["to"] = to_addr
        data["transaction"]["value"] = '{0:.0f}'.format(float(value)*pow(10, 18))

        raw_tx_data = self._sign_tx(data)
        res = self.request(url, raw_tx_data)
        print(res)

        if tx_type == 'sc':
            # we need to get the smart contract address
            smart_contract_addr = res["result"]["contract_address"]
            self._update_sc_addr(data["sc_name"], smart_contract_addr)

        self.check_tx_status(res['result']['txhash'])

    def check_tx_status(self, tx_hash):
        url = '%s/v1/user/getTransactionReceipt'%self.host
        data = {"hash":tx_hash}
        try:
            max = 10
            counter=0
            while counter<max:
                res = self.request(url, data)
                status = res['result']['status']
                if status == 1:
                    print(res)
                    print("\n[SUCCESS] Successfully send transaction!!\n")
                    break
                elif status == 0:
                    print("\n[ERROR] Error in sending the transaction!!\n")
                    break
                else:
                    print(">> Waiting for transaction to be onchain ...")
                time.sleep(5)
                counter+=1
            if counter >= max:
                print("\n[FAIL] Failed to send transaction!!\n")
        except:
            pass
        
    def transaction(self, from_addr, to_addr, value, passphrase):
        data = {"transaction":{}, "passphrase":passphrase}
        self._base_transaction(from_addr, to_addr, value, data)

    def sendIR(self, ir_file_path):
        addr_info = self.IR_POSTERS[self.vendor][0]
        from_addr = addr_info['addr']
        to_addr = from_addr
        value="0.0"
        passphrase = addr_info['passphrase']
        try:
            fp = open(ir_file_path, 'r')
            ir = fp.read()
            data = {"passphrase":passphrase, "transaction":{"protocol":ir.strip()}}
            self._base_transaction(from_addr, to_addr, value, data)
        except:
            pass
        finally:
            fp.close()

    def deploy_sc(self, sc_fp, deployer=None, passphrase=None):
        if deployer == None:
            deployer = self.SC_DEPLOYER[0]["addr"]
            passphrase = self.SC_DEPLOYER[0]["passphrase"]
        from_addr = deployer
        to_addr = deployer
        value = "0.0"

        fp = open(sc_fp, "r")
        try:
            contract_content = fp.read().strip()
            data = {"passphrase":passphrase, "transaction":{"contract":{"source":contract_content, "sourceType":"js", "args":""}}}
            data["sc_name"] = os.path.basename(sc_fp).split(".")[0]
            print(data)
            self._base_transaction(from_addr, to_addr, value, data, "sc")
        except:
            pass
        finally:
            fp.close()

    def call_method(self, contract_name, method_name):
        url = "%s/v1/admin/transactionWithPassphrase"%self.host
        from_addr = self.SC_DEPLOYER[0]['addr']
        passphrase = self.SC_DEPLOYER[0]['passphrase']
        to_addr = self._get_contract_address(contract_name)

        print("The contract address is: ", to_addr)
        
        value = 0.0
        # check nonce
        ex_nonce = self._check_nonce(from_addr)
        if ex_nonce < 0:
            err("failed to check from address nonce")
        nonce = ex_nonce + 1
        transaction_data = {"from":from_addr, "to":to_addr, "value":'{0:.0f}'.format(value*pow(10, 18)), "gasPrice":"1000000", "gasLimit":"2000000", 
                            "nonce":nonce, "contract":{"function":method_name, "args":""}}
        data = {"transaction":transaction_data, "passphrase":passphrase}
        res = self.request(url, data)
        print(res)

    def pure_call(self, contract_name, method_name):
        url = "%s/v1/user/call"%self.host
        from_addr = self.SC_DEPLOYER[0]['addr']
        to_addr = self._get_contract_address(contract_name)
        
        print("The called contract address is: ", to_addr, ", from addr is: ", from_addr)

        value = 0.0
        # check nonce
        ex_nonce = self._check_nonce(from_addr)
        if ex_nonce < 0:
            err("failed to check from address nonce")
        nonce = ex_nonce + 1
        data = {"from":from_addr, "to":to_addr, "value":'{0:.0f}'.format(value*pow(10, 18)), "gasPrice":"1000000", "gasLimit":"2000000", 
                            "nonce":nonce, "contract":{"function":method_name, "args":""}}
        res = self.request(url, data)
        print(res)

    def _load_credential(self):
        fp = open("credential.conf", "r")
        content = fp.read().strip()
        data = json.loads(content)
        self.internal = data.get("internal_host", self.local)
        self.IR_POSTERS = data.get("IR_POSTERS",{}).get("internal", [])
        self.SC_DEPLOYER = data.get("SC_DEPLOYER", [])
        fp.close()


    def driver(self, method, paras):
        self._load_credential()

        if method == 'create':
            if len(paras) < 1:
                print("Please specify the new account passphrase!")
                exit(1)
            self.create_account(paras[0])
        elif method == 'check_accounts':
            self.check_accounts()
        elif method == 'accounts':
            self.show_accounts()
        elif method == 'balance':
            if len(paras) < 1:
                print("Please specify the address!")
                exit(1)
            self.balance(paras[0])
        elif method == 'transaction' or method == 'tx':
            if len(paras) < 4:
                print("Please specify the from addr, to addr, value, passphrase and nonce(optional)")
                exit(1)
            from_addr = paras[0]
            to_addr = paras[1]
            value = paras[2]
            passphrase = paras[3]
            self.transaction(from_addr, to_addr, value, passphrase)
        elif method == 'sendir':
            if len(paras)<1:
                print("Please specify the ir file path, should be base64 encoded")
                exit(1)
            self.sendIR(paras[0])
        elif method == 'smartcontract':
            if len(paras) < 1:
                print("Please specify the smart contract file path")
                exit(1)
            self.deploy_sc(paras[0])
        elif method == 'method':
            if len(paras) < 2:
                print("Please specify the smart contract name and the method name")
                exit(1)
            self.call_method(paras[0], paras[1])
        elif method == 'call':
            if len(paras) < 2:
                print("Please specify the smart contract name and the method name")
                exit(1)
            self.pure_call(paras[0], paras[1])
        elif method == 'create':
            inst = Neb(host)
            inst.create_account("samuel@nebulas")
        else:
            print("Invalid method!\nSupported methods are: \n")
            print(Neb.REGISTER_APIS)
            print("\n")
     
        # record the successful command
        fp = open(self.CMD_RECORD_FILE_NAME, 'a')
        cmd_line = "python3 "
        for cmd in sys.argv:
            cmd_line += cmd + " "
        fp.write(cmd_line + "\n")
        fp.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python %s [mainnet | testnet | internal | ...] method([balance | tx | ...]) address ..."%__file__)
        exit(1)
    else:
        host = sys.argv[1]
        if host != 'mainnet' and host != 'testnet' and host != "local" and host != "internal":
            print("specify which net you wanna connect to, the value can be mainnet, testnet or local")
            exit(1)

        inst = Neb(host)
        methods = inst.get_register_methods()
        method = sys.argv[2]
        
        if method not in methods:
            print("Invalid method!\nSupported methods are: \n")
            print(Neb.REGISTER_APIS)
            print("\n")
            exit(1)

        inst.driver(method, sys.argv[3:])
