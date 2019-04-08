'use strict';

// Parse and toString method used in the serialization of complex object.
// They will be called implicitly during object saving and retrieving from persistent storage.
let Serializable = {
    parseObj(obj) {
        if (Object.prototype.toString.call(obj) === '[object String]') {
            this._parseObj(JSON.parse(obj));
        } else if (Object.prototype.toString.call(obj) === '[object Object]') {
            this._parseObj(obj);
        }
    },

    toString() {
        return JSON.stringify(this)
    }
};

function extendsSerializable(protoObj) {
    protoObj.__proto__ = Serializable;
    return protoObj
}

// Two groups: Chair & Executive
const ROLE_CHAIR = 'chair';
const ROLE_EXEC = 'exec';

let Governance = function(obj) {
    this._txNonce = 0; // Index of the proposals, always growing by one after the contract is deployed.
    this._completedTxs = {}; // Proposal marked as completed after submitted to avoid duplicated submission.
    this._votingAddresses = {}; // All the addresses assigned to chair or exec. It is set during the deployment of contract and cannot by changed afterwards.
    this._txChairApprovals = {}; // Proposal is approved or disapproved by a chairman.
    this._txExecApprovals = {}; // Proposal is approved or disapproved by an executor.

    this.parseObj(obj);
};

// parse the string to object
let GovernanceProto = {
    _parseObj(data) {
        if (data.hasOwnProperty('_votingAddresses')) {
            let vAddrs = data['_votingAddresses'];
            for (let addr in vAddrs) {
                if (vAddrs[addr] === ROLE_CHAIR ||
                    vAddrs[addr] === ROLE_EXEC) {
                    this._votingAddresses[addr] = vAddrs[addr];
                }
            }
        }
        if (data.hasOwnProperty('_txNonce')) {
            this._txNonce = data['_txNonce'];
        }
        if (data.hasOwnProperty('_completedTxs')) {
            let cTxs = data['_completedTxs'];
            for (let tx in cTxs) {
                this._completedTxs[tx] = cTxs[tx];
            }
        }
        if (data.hasOwnProperty('_txChairApprovals')) {
            let cApprs = data['_txChairApprovals'];
            for (let tx in cApprs) {
                this._txChairApprovals[tx] = cApprs[tx];
            }
        }
        if (data.hasOwnProperty('_txExecApprovals')) {
            let eApprs = data['_txExecApprovals'];
            for (let tx in eApprs) {
                this._txExecApprovals[tx] = eApprs[tx];
            }
        }
    },
    // Return true if the address represent a board chair
    _isChair(addr) {
        return this._votingAddresses[addr] &&
            this._votingAddresses[addr] === ROLE_CHAIR
    },
    // Return true if the address represents an executive
    _isExec(addr) {
        return this._votingAddresses[addr] &&
            this._votingAddresses[addr] === ROLE_EXEC
    },
    // return the transaction nonce, increase by one after a valid proposal
    propose(addr) {
        if (this.isAuthorized(addr)) {
            return ++this._txNonce
        }
        return 0
    },
    // check if the address belong to the voting address set
    isAuthorized(addr) {
        return this._votingAddresses.hasOwnProperty(addr)
    },
    // approve a proposal by index
    approve(addr, txNonce) {
        if (this._isChair(addr)) {
            this._txChairApprovals[txNonce] = true;
        } else if (this._isExec(addr)) {
            this._txExecApprovals[txNonce] = true;
        }
    },
    // check if the proposal is approved by account from each group
    approved(txNonce) {
        return !!(this._txExecApprovals[txNonce] && this._txChairApprovals[txNonce])
    },
    // mark the proposal as completed
    submit(txNonce) {
        if (this.approved(txNonce) && !this._completedTxs[txNonce]) {
            return this._completedTxs[txNonce] = true
        }
        return false
    }
};

Governance.prototype = extendsSerializable(GovernanceProto);

var version = "1.0.0";

let AllowedProto = {
    toString() {
        return JSON.stringify(this.allowed)
    },

    _parseObj(data) {
        for (let key in data) {
            this.allowed[key] = new BigNumber(data[key]);
        }
    },

    get(key) {
        return this.allowed[key]
    },

    set(key, value) {
        this.allowed[key] = new BigNumber(value);
    }
};

// transfer with allowance
let Allowed = function(obj) {
    this.allowed = {};
    this.parseObj(obj);
};

Allowed.prototype = extendsSerializable(AllowedProto);

// pause certain function for good reasons
let PauseProto = {
    _parseObj(data) {
        this._isPaused = false; // current contract pause status; true for paused;
        if (data.hasOwnProperty('_isPaused')) {
            this._isPaused = data['_isPaused'];
        }
        // proposed pause transactions
        if (data.hasOwnProperty('_pauseTransactions')) {
            let txs = data['_pauseTransactions'];
            for (let key in txs) {
                this._pauseTransactions[key] = new PauseTransaction(txs[key]);
            }
        }
    },

    // the pause value need to be boolean
    _checkValue(value) {
        return typeof(value) == 'boolean'
    },

    create(nonce, value) {
        if (nonce <= 0) {
            throw new Error("only voting members can propose pause.")
        }

        if (this._pauseTransactions[nonce]) {
            throw new Error("reused nonce not allowed.")
        }

        if (!this._checkValue(value)) {
            throw new Error("invalid pause value.")
        }

        let pauseTx = {};
        pauseTx["_approvalNonce"] = nonce;
        pauseTx["_value"] = value;
        // save the proposal to a waiting list
        this._pauseTransactions[nonce] = new PauseTransaction(pauseTx);
    },
    // get pause propose detail
    getPauseTx(approvalNonce) {
        return this._pauseTransactions[approvalNonce]
    },
    // check if the system is paused
    isPaused() {
        return this._isPaused
    },
    // set the system pause status to approved pause value
    submit(approvalNonce) {
        let tx = this._pauseTransactions[approvalNonce];
        if (tx instanceof PauseTransaction && this._checkValue(tx["_value"])) {
            this._isPaused = tx["_value"];
            return tx
        }
        throw new Error("invalid pause transaction nonce.")
    }
};

let Pause = function(obj) {
    this._isPaused = false; // current contract pause status
    this._pauseTransactions = {};
    this.parseObj(obj);
};

Pause.prototype = extendsSerializable(PauseProto);

let PauseTransaction = function(obj) {
    this.parseObj(obj);
};

let PauseTransactionProto = {
    _parseObj(data) {
        if (data.hasOwnProperty('_approvalNonce')) {
            this._approvalNonce = data['_approvalNonce'];
        }
        if (data.hasOwnProperty('_value')) {
            this._value = data['_value'];
        }
    }
};

PauseTransaction.prototype = extendsSerializable(PauseTransactionProto);

let MintTransaction = function(obj) {
    this.parseObj(obj);
};

let MintTransactionProto = {
    _parseObj(data) {
        if (data.hasOwnProperty('_approvalNonce')) {
            this._approvalNonce = data['_approvalNonce']; // proposal index
        }
        if (data.hasOwnProperty('_to')) {
            this._to = data['_to']; // the address tokens minted to
        }
        if (data.hasOwnProperty('_value')) {
            this._value = data['_value']; // amount of minted token
        }
    }
};

MintTransaction.prototype = extendsSerializable(MintTransactionProto);

let Minter = function(obj) {
    this._remainingSupply = null; // remaining available amount; set on the deployment of contract
    this._mintTransactions = {};
    this.parseObj(obj);
};

let MinterProto = {
    _parseObj(data) {
        if (data.hasOwnProperty('_remainingSupply')) {
            this._remainingSupply = new BigNumber(data['_remainingSupply']);
        }
        if (data.hasOwnProperty('_mintTransactions')) {
            let txs = data['_mintTransactions'];
            for (let key in txs) {
                this._mintTransactions[key] = new MintTransaction(txs[key]);
            }
        }
    },

    _checkValue(value) {
        let v = value instanceof BigNumber ? value : (new BigNumber(value));
        return v.isFinite() && !v.isNaN() && v.gte(0)
    },

    _checkCanMint(value) {
        if (!this._checkValue(value) || !this._checkValue(this._remainingSupply)) {
            return false
        }
        return (new BigNumber(this._remainingSupply))
            .gte(new BigNumber(value))
    },

    create(nonce, to, value) {
        if (nonce <= 0) {
            throw new Error("only voting members can propose minting.")
        }

        if (this._mintTransactions.hasOwnProperty(nonce)) {
            throw new Error("reused nonce not allowed.")
        }

        if (!this._checkValue(value)) {
            throw new Error("invalid mint amount.")
        }

        if (!this._checkCanMint(value)) {
            throw new Error("insufficient supply remaining for minting.")
        }

        let mintTx = {};
        mintTx["_approvalNonce"] = nonce;
        mintTx["_to"] = to;
        mintTx["_value"] = value;
        this._mintTransactions[nonce] = new MintTransaction(mintTx);
    },

    getMintTx(approvalNonce) {
        return this._mintTransactions[approvalNonce]
    },

    submit(approvalNonce) {
        let tx = this._mintTransactions[approvalNonce];
        if (tx === null || typeof tx === 'undefined') {
            throw new Error("invalid mint transaction nonce.")
        }
        return tx
    }
};

Minter.prototype = extendsSerializable(MinterProto);

let ATPToken = function() {
    LocalContractStorage.defineProperties(this, {
        _name: null, // token name
        _symbol: null, // token symbol
        _decimals: null, // decimal of token
        _totalSupply: { // total supply of token
            parse(val) {
                return new BigNumber(val)
            },
            stringify(obj) {
                return obj.toString(10)
            }
        },
        governance: {
            parse(val) {
                return new Governance(val)
            },
            stringify(obj) {
                return obj.toString()
            }
        },
        minter: {
            parse(val) {
                return new Minter(val)
            },
            stringify(obj) {
                return obj.toString()
            }
        },
        pause: {
            parse(val) {
                return new Pause(val)
            },
            stringify(obj) {
                return obj.toString()
            }
        }
    });

    LocalContractStorage.defineMapProperties(this, {
        // balance ledger
        "balances": {
            parse(val) {
                return new BigNumber(val)
            },
            stringify(obj) {
                return obj.toString()
            }
             "allowed": {
            parse(val) {
                retingify(obj) {
                return obj.toString()
           ,000,000,000
ATPToken.prototype = {
    init(name$$1, symbol, dnew BigNumber(10)).pow(decimals);

        this._name = name$$1     this._totalSupply = (new BigNumber(totalSupply)).mul(wei);pply: this._totalSupply
        });
        this.governance = nmultiple signing mechanism
        this.pause = new Pause(); //to change the pause status
        let proposer = Blockchain.tr        let pause = this.pause;
        let nonce = gov.proposehis.governance = gov;
        this.pause = pause;

        retulNonce) {
        let from = Blockchain.transaction.from;

    row new Error(
                "unauthorized account.")
       approvalNonce);
        this.governance = gov;
    },

    subm
        if (!this.governance.isAuthorized(from)) {
           d account.")
        }
        // change the system pause statut(approvalNonce)) {
            throw new Error(
              .")
        }
        let pause = this.pause;
        let pauseion) {
            this.pauseEvent(pause.isPaused());
        }e info
    getPauseTx(approvalNonce) {
        return this.pausf the function is paused
    isPaused() {
        return this.p {
        let proposer = Blockchain.transaction.from;
         let nonce = gov.propose(proposer);
        minter.create(nonceovernance = gov;

        return nonce
    },
    // approved m Blockchain.transaction.from;

        if (!this.governance.isAuthorized(from)) {
            throw new Error(
                "unauthorized account.")
        }
        let gov = this.governance;
        gov.approve(from, approvalNonce);
        this.governance = gov;
    },
    // get proposed mint info
    getMintTx(approvalNonce) {
        return this.minter.getMintTx(approvalNonce)
    },

    submitMinting(approvalNonce) {
        let from = Blockchain.transaction.from;

        if (!this.gove(from)) {
            throw new Error(
                "unauthopropose
        let gov = this.governance;
        if (!gov.sub          "unauthorized mint transaction or transaction resubmintTx = mint.submit(approvalNonce);
        if (mintTx instanceorom;
            let amount = mintTx._value;
            let to    let newBalance = curBalance.add(new BigNumber(amount));
   ount)) {
                this.balances.set(to, newBalance);
                mint._remainingSupply = mint._remainingSupply.sub(.governance = gov;
    },

    currentSupply() {
        return10)
    },

    // Returns the name of the token
    name() {
  symbol of the token
    symbol() {
        return this._symbolmals() {
        return this._decimals
    },

    totalSupply(
    // token balance
    balanceOf(owner) {
        let balancceof BigNumber) {
            return balance.toString(10)
       transfer(to, value) {
        if (this.isPaused()) {
                value = new BigNumber(value);
        if (value.lt(0)) id value.")
        }

        // from address
        let froms.get(from) || new BigNumber(0);

        if (balance.lt(value)   this.balances.set(from, balance.sub(value));
        let toB0);
        this.balances.set(to, toBalance.add(value));

     ransfer token with allowed values
    transferFrom(from, to, va"function suspended.")
        }

        let spender = Blockch) || new BigNumber(0);

        let allowed = this.allowed.get(allowed.get(spender) || new BigNumber(0);
        value = new Ber value must gte 0')
        }
        if (balance.lt(value)) 
        }
        if (allowedValue.lt(value)) {
            th     this.balances.set(from, balance.sub(value));

        // ualue));
        this.allowed.set(from, allowed);

        let t    this.balances.set(to, toBalance.add(value));

        this.vent(value) {
        Event.Trigger(this.name(), {
             {
        Event.Trigger(this.name(), {
            Status: sta               to: to,
                value: value
             approve(spender, currentValue, value) {
        let from = Bl spender);
        if (oldValue != currentValue.toString()) {
 stake.")
        }

        let balance = new BigNumber(this.ba      if (val.lt(0) || balance.lt(val)) {
            throw new || new Allowed();
        owned.set(spender, val);

        thue, from, spender, val);
    },

    approveEvent(status, from,      Status: status,
            Approve: {
                ow               value: value
            }
        });
    },

 );

        if (owned instanceof Allowed) {
            let spd) {
                return spd.toString(10)
            }
         return version
    }
};

module.exports = ATPToken;
