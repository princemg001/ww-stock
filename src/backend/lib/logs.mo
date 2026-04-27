import List "mo:core/List";
import Array "mo:core/Array";
import CommonTypes "../types/common";
import LogTypes "../types/logs";

module {
  public func addLog(
    logs : List.List<LogTypes.Log>,
    nextId : Nat,
    productId : CommonTypes.ProductId,
    productName : Text,
    size : Text,
    logType : LogTypes.LogType,
    qty : Nat,
    remark : Text,
    userName : Text,
    userId : Text,
    timestamp : CommonTypes.Timestamp,
  ) : LogTypes.Log {
    let entry : LogTypes.Log = {
      id = nextId;
      productId;
      productName;
      size;
      logType;
      qty;
      remark;
      userName;
      userId;
      timestamp;
      hasBeenEdited = false;
      editedBy = null;
    };
    logs.add(entry);
    entry
  };

  public func getAllReverse(logs : List.List<LogTypes.Log>) : [LogTypes.Log] {
    logs.reverse().toArray()
  };

  // Any user can edit their own log once; admin can edit any log regardless of prior edits.
  public func updateLog(
    logs : List.List<LogTypes.Log>,
    logId : CommonTypes.LogId,
    newRemark : Text,
    callerUserId : Text,
    isAdmin : Bool,
  ) : { #ok : LogTypes.Log; #err : Text } {
    var found = false;
    var result : { #ok : LogTypes.Log; #err : Text } = #err("Log not found");

    logs.mapInPlace(func(log) {
      if (log.id == logId) {
        found := true;
        if (isAdmin) {
          let updated = { log with remark = newRemark; hasBeenEdited = true; editedBy = ?callerUserId };
          result := #ok(updated);
          updated
        } else if (log.userId == callerUserId) {
          if (log.hasBeenEdited) {
            result := #err("You have already edited this log entry once");
            log
          } else {
            let updated = { log with remark = newRemark; hasBeenEdited = true; editedBy = ?callerUserId };
            result := #ok(updated);
            updated
          }
        } else {
          result := #err("You can only edit your own log entries");
          log
        }
      } else log
    });

    result
  };

  // Admin-only: remove a log entry permanently and return the deleted log so the caller
  // can reverse its stock effect.
  public func deleteLog(
    logs : List.List<LogTypes.Log>,
    logId : CommonTypes.LogId,
  ) : { #ok : LogTypes.Log; #err : Text } {
    var deleted : ?LogTypes.Log = null;

    let kept = logs.filter(func(log) {
      if (log.id == logId) {
        deleted := ?log;
        false
      } else true
    });

    switch (deleted) {
      case null #err("Log not found");
      case (?log) {
        // Clear the list and re-add all kept entries
        logs.clear();
        logs.append(kept);
        #ok(log)
      };
    }
  };
};
