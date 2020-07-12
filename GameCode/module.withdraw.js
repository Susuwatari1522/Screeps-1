const harvestModule = require('module.harvest');
const harvestLDModule = require('module.harvestLD');


module.exports = {
  run: function(creep) {
    const flagMemory = Memory.flags[creep.room.name];


    function mainSystem() {
      // If Memory.mainSystem is defined //
      if (Memory.mainSystem) {
        // If Memory.mainSystem is allowed to track cpu return True //
        if (Memory.mainSystem.cpuTracker == true) {
          return true;
        }
        else {
          return false;
        }
      }
      else {
        return false;
      }
    }

    if (!creep.memory.withdrawId)
      creep.memory.withdrawId = ""


    function createSurroundingConstructionSite(id,range,controllerLevel) {
      const room = creep.room
      let object = Game.getObjectById(id);
      let structureType;
      let x = object.pos.x;
      let y = object.pos.y;
      let constructionSiteCanBeBuild = false;
      function createConstruction(structureType,x,y) {
        if (room.createConstructionSite(x,y,structureType) == 0) {
          return true;
        }
        else {
          return false;
        }
      }

      if (object.room.controller.level >= controllerLevel) {
        structureType = STRUCTURE_LINK;
      }
      else {
        structureType = STRUCTURE_CONTAINER;
      }

      let containerInRange = object.pos.findClosestByRange(FIND_STRUCTURES, {filter: (structure) => {
        return (structure.pos.inRangeTo(object,range) && structure.structureType == STRUCTURE_CONTAINER)}
      });
      let linkInRange = object.pos.findClosestByRange(FIND_STRUCTURES, {filter: (structure) => {
        return (structure.pos.inRangeTo(object,range) && structure.structureType == STRUCTURE_LINK)}
      });
      let constructionSitesInRange = object.pos.findClosestByRange(FIND_CONSTRUCTION_SITES, {filter: (structure) => {
        return (structure.pos.inRangeTo(object,range) && (structure.structureType == STRUCTURE_CONTAINER || structure.structureType == STRUCTURE_LINK))}
      });


      if (((!containerInRange && structureType == STRUCTURE_CONTAINER) || (!linkInRange && structureType == STRUCTURE_LINK)) && constructionSitesInRange == null) {
        if (structureType == STRUCTURE_LINK && containerInRange !== null) {
          containerInRange.destroy();
        }

        if (createConstruction(structureType,x+range,y+range) == true && constructionSiteCanBeBuild == false) {
          room.createConstructionSite(x+range,y+range,structureType)
          constructionSiteCanBeBuild = true
        }
        else if (createConstruction(structureType,x,y+range) == true && constructionSiteCanBeBuild == false) {
          room.createConstructionSite(x+range,y+range,structureType)
          constructionSiteCanBeBuild = true
        }
        else if (createConstruction(structureType,x-range,y+range) == true && constructionSiteCanBeBuild == false) {
          room.createConstructionSite(x+range,y+range,structureType)
          constructionSiteCanBeBuild = true
        }
        else if (createConstruction(structureType,x-range,y) == true && constructionSiteCanBeBuild == false) {
          room.createConstructionSite(x+range,y+range,structureType)
          constructionSiteCanBeBuild = true
        }
        else if (createConstruction(structureType,x-range,y-range) == true && constructionSiteCanBeBuild == false) {
          room.createConstructionSite(x+range,y+range,structureType)
          constructionSiteCanBeBuild = true
        }
        else if (createConstruction(structureType,x,y-range) == true && constructionSiteCanBeBuild == false) {
          room.createConstructionSite(x+range,y+range,structureType)
          constructionSiteCanBeBuild = true
        }
        else if (createConstruction(structureType,x+range,y-range) == true && constructionSiteCanBeBuild == false) {
          room.createConstructionSite(x+range,y+range,structureType)
          constructionSiteCanBeBuild = true
        }
        else if (createConstruction(structureType,x,y-range) == true && constructionSiteCanBeBuild == false) {
          room.createConstructionSite(x+range,y+range,structureType)
          constructionSiteCanBeBuild = true
        }
      }
    };


    function withdrawUpgraderSection() {
      const target = Game.getObjectById(flagMemory.controllerStorage);
      if (!target) {
        if (creep.room.controller) {
          let range = 3;
          let containerInRange = creep.room.controller.pos.findInRange(creep.room.containers, range,
            {filter: {structureType: STRUCTURE_CONTAINER}
          })[0];
          let linkInRange = creep.room.controller.pos.findInRange(creep.room.links, range,
            {filter: {structureType: STRUCTURE_LINK}
          })[0];
          let constructionSiteInRange = creep.room.controller.pos.findClosestByRange(FIND_CONSTRUCTION_SITES, {filter: (structure) => {
            return (structure.pos.inRangeTo(creep.room.controller,range))
          }});


          if (containerInRange) {
            flagMemory.controllerStorage = containerInRange.id;
          }
          else if (linkInRange) {
            flagMemory.controllerStorage = linkInRange.id;
          }
          else if (constructionSiteInRange == null) {
            createSurroundingConstructionSite(creep.room.controller.id,range,6,creep.room)
          }
          else {
            harvestModule.run(creep);
          }
        }
      }
      else {
        if(creep.withdraw(target,RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
          creep.travelTo(target);
        }
      }
    }

    function runWithdraw(target) {
      const runWithdraw = creep.withdraw(target,RESOURCE_ENERGY);

      switch(runWithdraw) {
        case OK:
        creep.say("Withdraw");
        creep.memory.withdrawId = "";
        break;
        case ERR_NOT_OWNER:
        break;
        case ERR_BUSY:
        break;
        case ERR_NOT_ENOUGH_RESOURCES:
        break;
        case ERR_INVALID_TARGET:
        if (!creep.pos.inRangeTo(creep.room.controller,4))
        creep.travelTo(creep.room.controller);
        break;
        case ERR_FULL:
        break;
        case ERR_NOT_IN_RANGE:
        creep.say("Moving");
        creep.travelTo(target);
        break;
        case ERR_INVALID_ARGS:
        break;
        default:
        break;
      }
    }

    function findWithdrawStructure() {
      const room = creep.room;
      let withdrawStructure = null;

      function checkStorage() {
        if (room.storage)
          if (room.storage.store.getUsedCapacity(RESOURCE_ENERGY) > 500) {
            withdrawStructure = STRUCTURE_STORAGE;
            creep.memory.withdrawId = room.storage.id;
            return true;
          }
      }
      function checkTerminal() {
        if (room.terminal)
          if (room.terminal.store.getUsedCapacity(RESOURCE_ENERGY) > 500) {
            withdrawStructure = STRUCTURE_TERMINAL
            creep.memory.withdrawId = room.terminal.id;
            return true;
          }
      }
      function checkContainers() {
        if (room.containers.length > 0) {
          let energyStored = 0;
          room.containers.forEach((item, i) => {
            energyStored += room.containers[i].store.getUsedCapacity(RESOURCE_ENERGY);
          });
          if (energyStored > 500) {
            target = creep.pos.findClosestByRange(creep.room.containers, {filter: (structure) => {
              return (!structure.pos.inRangeTo(creep.room.controller,3) && structure.store.getUsedCapacity(RESOURCE_ENERGY) > 0)}
            });
            if (target !== null) {
              withdrawStructure = STRUCTURE_CONTAINER;
              creep.memory.withdrawId = target.id;
              return true;
            }
          }
        }
      }
      function checkLinks() {
        if (room.links.length > 0) {
          let energyStored = 0;
          room.links.forEach((item, i) => {
            if (!item.pos.inRangeTo(creep.room.controller,3))
              energyStored += room.links[i].store.getUsedCapacity(RESOURCE_ENERGY);
          });

          if (energyStored > 500) {
            target = creep.pos.findClosestByRange(creep.room.links, {filter: (structure) => {
              return (!structure.pos.inRangeTo(creep.room.controller,3) && structure.store.getUsedCapacity(RESOURCE_ENERGY) > 0)}
            });
            if (target !== null) {
              withdrawStructure = STRUCTURE_LINK;
              creep.memory.withdrawId = target.id;
              return true;
            }
          }
        }
      }


      if (!checkStorage())
        if (!checkTerminal())
          if (!checkContainers())
            if (!checkLinks()) {
              if (creep.memory.role !== "transferer") {
                creep.memory.withdrawId = "source"
              }
            }


      creep.say(withdrawStructure)

      return withdrawStructure;
    }

    function withdrawStructure() {
      if (creep.memory.role.includes("LD")) {
        harvestModule.run(creep);
      }
      else {
        if (creep.memory.withdrawId.length > 0) {
          if (creep.memory.withdrawId == "source")
            harvestModule.run(creep);
          else
            runWithdraw(Game.getObjectById(creep.memory.withdrawId));
        }
        else {
          if (Game.time % 2 == 0) {
            findWithdrawStructure();
          }
        }
      }
    }

    if (creep.memory.role.includes("upgrader")) {
      if (mainSystem()) {
        // Get the CPU Usage //
        let start = Game.cpu.getUsed();

        // Run the part //
        withdrawUpgraderSection();

        // Set the average CPU Usage in the memory //

        Memory.cpuTracker["withdrawCPU.upgrader"] += Game.cpu.getUsed() - start;
      }
      else {
        // Run the part without tracking //
        withdrawUpgraderSection();
      }
    }
    else {
      if (mainSystem()) {
        // Get the CPU Usage //
        let start = Game.cpu.getUsed();
        // Run the part //
        withdrawStructure();

        // Set the average CPU Usage in the memory //

        Memory.cpuTracker["withdrawCPU.normal"] += Game.cpu.getUsed() - start;
      }
      else {
        // Run the part without tracking //
        withdrawStructure();
      }
    }
  }
};