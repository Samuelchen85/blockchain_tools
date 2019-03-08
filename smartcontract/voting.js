"use strict";

var assert = function(expr, msg){
  if(!expr){
    throw msg;
  }
}

// voter's info, including: address and timestamp
var VoterItem = function(user){
 this.user = user;
 this.ts = Date.now();
};

// option's info, including: option_name, voterItem list
var OptionItem = function(name){
  this.option_name = name;
  this.voters = new Set();
};

OptionItem.prototype = {
  toString: function(){
    return JSON.stringify(this);
  },
};

var Scene = function(name, admin, owner) {
  LocalContractStorage.defineProperties(this, {
    _users: new Set(),   // set for keeping all users
    _owner: owner,   // owner of current scene
    _admin: admin,   // creator of the contract
    _name: name,    // name of the scene
  });

  LocalContractStorage.defineMapProperty(this, "_options"); // index -> option text
};

Scene.prototype = {

  _authorityCheck: function(){
    if(Blockchain.transaction.from != this._owner || Blockchain.transaction.from != this._admin)
      throw new Error("This operation can only be done by owner or admin");
  },

  // public methods
  getOwner: function(){
    return this._owner;
  },

  setOwner: function(owner){
    this._authorityCheck();
    this._owner = owner;
  },

  // add an option into current scene
  addOption: function(optionName){
    this._authorityCheck();

    this._options.set(this._options.size+1, new OptionItem(optionName));
  },

  // authority required: delete option according to the "optionIndex"
  deleteOption: function(optionIndex){
    this._authorityCheck();

    // convert index to integer
    var indx = parseInt(optionIndex, 10);
    if(indx<=0 || indx>this._options.size)
      throw new Error("Invalid option index");

    var optionItem = this._options.get(indx);
    for(let voter of optionItem.voters){
      this._users.delete(voter.user);
      optionItem.voters.delete(voter);
    }
    this._options.delete(indx);
  },

  // vote one option
  voteOption: function(option_index, user){
    var indx = parseInt(option_index, 10);
    if(indx < 1 || indx > this._options.size)
      throw new Error("Invalid option choice");
    if(user == undefined || user.length == 0)
      throw new Error("Invalid user address");
    var optionItem = this._options.get(indx);
    optionItem.voters.add(new VoterItem(user));
    this._users.add(user);
  },

  // did given "user" vote?
  hasVote: function(){
    return this._users.has(Blockchain.transaction.from); 
  },

  // authority required: remove one user's vote
  deleteVote: function(user){
    this._authorityCheck();

    if(!this._users.has(user))
      throw new Error("The user did not even voted");

    for(var i=1; i<=this._options.size; i++){
      var voters = this._options.get(i).voters;
      for(let voter of voters){
        if(voter.user == user){
          voters.delete(voter);
          break;
        }
      }
    }
    this._users.delete(user);
  },

  toString: function(){
    return JSON.stringify(this);
  },
};

var VoteContract = function(){
  LocalContractStorage.defineProperties(this, {
    _admin: null,
  });
  LocalContractStorage.defineMapProperty(this, "_scenes");  // name -> scene
}

VoteContract.prototype = {
  //private functions
  _authorityCheck: function(){
    if(Blockchain.transaction.from != this._admin)
      throw new Error("This operation can only be done by admin");
  },

  _toString: function(){
    return JSON.stringify(this);
  },

  _verifyAddress: function(addr){
    var res = Blockchain.verifyAddress(addr);
    return res==1?true:false;
  },

  //public functions
  init: function(){
    // set creator to be the admin of this contract
    this._admin = Blockchain.transaction.from;
  },

  // authority required: set owner of given "scene" to be "owner"
  setOwner: function(sceneName, owner){
    if(!this._verifyAddress(owner))
      throw new Error("Invalid owner address");

    var scene = this._scenes.get(sceneName);
    if(scene == undefined)
      throw new Error("Scene does not exist!");
    scene.setOwner(owner);
  },

  createScene: function(name, owner){
    if(name == undefined || name.length == 0){
      console.log("Voting scene name cannot be empty");
      throw new Error("Voting scene name cannot be empty");
    }
    if(owner == undefined || owner.length == 0){
      console.log("Voting scene owner is required");
      throw new Error("Voting scene owner is required");
    }
    
    this._authorityCheck();
    
    this._scenes.set(name, new Scene(name, this._admin, owner));
  },

  deleteScene: function(name){
    if(Blockchain.transaction.from != this._admin){
      // check authority
      var sceneObj = this._scenes.get(name);
      if(sceneObj != undefined){
        if(Blockchain.transaction.from != sceneObj.getOwner())
          throw new Error("Only admin or owner can do this!");
      }
    }
    this._scenes.delete(name);
  },

  vote: function(name, optionIndx){
    var scene = this._scenes.get(name);

    if(scene == undefined)
      throw new Error("Scene does not exist");

    scene.voteOption(optionIndx, Blockchain.transaction.from);
  },
  
  // if current user has already voted
  hasVote: function(name){
    var scene = this._scenes.get(name);
    if(scene == undefined)
      throw new Error("Scene does not exist");
    
    return scene.hasVote();
  },

  // remove the user's vote in scene with name
  deleteVote: function(name, user){
    var scene = this._scenes.get(name);
    if(scene == undefined)
      throw new Error("Scene does not exist");
    //verify user's address
    if(!this._verifyAddress(user))
      throw new Error("Invalid user address");
    scene.deleteVote(user);
  },

  // authority required: show all scenes created so far
  getScenes: function(){
    this._authorityCheck();
    return this._toString();
  },
};

module.exports = VoteContract;
