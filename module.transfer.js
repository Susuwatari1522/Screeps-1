const builderModule = require('module.builder');

module.exports = {
  run: function(creep) {
    const flagMemory = Memory.flags[creep.room.name]


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

    function transferTarget() {
      const target = creep.transfer(Game.getObjectById(creep.memory.targetId),RESOURCE_ENERGY);
      switch(target) {
        case OK:
        creep.say("Transfer")
        creep.memory.targetId = "";
        case ERR_NOT_OWNER:
        break;
        case ERR_BUSY:
        break;
        case ERR_NOT_ENOUGH_RESOURCES:
        break;
        case ERR_INVALID_TARGET:
        findNewTarget();
        break;
        case ERR_FULL:
        findNewTarget();
        break;
        case ERR_NOT_IN_RANGE:
        creep.travelTo(Game.getObjectById(creep.memory.targetId));
        break;
        case ERR_INVALID_ARGS:
        break;
        default:
        break;
      }
    }


    function findNewTarget() {
      if (creep.memory.role.includes("harvest")) {
        let sourceObject = Game.getObjectById(creep.memory.sourceId);
        let containerInRange = creep.pos.findClosestByRange(creep.room.containers, {filter: (structure) => {
          return (structure.pos.inRangeTo(sourceObject,2) && structure);
        }});
        let linkInRange = creep.pos.findClosestByRange(creep.room.links, {filter: (structure) => {
          return (structure.pos.inRangeTo(sourceObject,2));
        }});


        if (containerInRange !== null)
          creep.memory.targetId = containerInRange.id;
        else if (linkInRange !== null)
          creep.memory.targetId = linkInRange.id;
        else
          builderModule.run(creep);
      }
      else {
        let target = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
          filter: (s) => (s.structureType === STRUCTURE_SPAWN
            || s.structureType === STRUCTURE_EXTENSION
            || (s.structureType === STRUCTURE_TOWER && s.store.getUsedCapacity(RESOURCE_ENERGY) < 500 && creep.store.getUsedCapacity(RESOURCE_ENERGY) >= 150) && flagMemory.energyAvailable == flagMemory.energyCapacity
          ) && s.energy < s.energyCapacity
        });
        const controllerStorage = creep.room.controller.pos.findClosestByRange((creep.room.containers || creep.room.links), {filter: (structure) => {
          return (structure.pos.inRangeTo(creep.room.controller,3) && structure.store.getUsedCapacity() < structure.store.getCapacity())
        }});

        if (target !== null)
        creep.memory.targetId = target.id;
        else
          if (controllerStorage)
          creep.memory.targetId = controllerStorage.id;
          else
          creep.travelTo(creep.room.controller);
      }
    }

    if (mainSystem()) {
      // Get the CPU Usage //
      let start = Game.cpu.getUsed();

      // Run the part //
      transferTarget();

      // Set the average CPU Usage in the memory //

      Memory.cpuTracker["transferCPU.total"] += Game.cpu.getUsed() - start;
    }
    else {
      // Run the part without tracking //
      transferTarget();
    }
  }
};
