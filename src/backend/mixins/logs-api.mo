import List "mo:core/List";
import Map "mo:core/Map";
import UserTypes "../types/users";
import LogTypes "../types/logs";
import CommonTypes "../types/common";
import ProductTypes "../types/products";
import LogLib "../lib/logs";
import UserLib "../lib/users";
import ProductLib "../lib/products";

mixin (
  users : Map.Map<Text, UserTypes.User>,
  products : Map.Map<CommonTypes.ProductId, ProductTypes.Product>,
  logs : List.List<LogTypes.Log>,
) {
  // All authenticated users can view logs (no admin restriction).
  public query func getLogs() : async [LogTypes.Log] {
    LogLib.getAllReverse(logs)
  };

  // Any user can edit their own log entry once (remark only).
  // Admin or owner (by userId) can edit any entry regardless of prior edits.
  public shared func updateLog(
    logId : Nat,
    newRemark : Text,
    callerUserId : Text,
  ) : async { #ok : LogTypes.Log; #err : Text } {
    switch (UserLib.findUser(users, callerUserId)) {
      case null #err("User not found");
      case (?user) {
        let isAdmin = UserLib.isAdminRole(user.role);
        LogLib.updateLog(logs, logId, newRemark, callerUserId, isAdmin)
      };
    }
  };

  // Admin or owner only: permanently delete a log entry and atomically reverse its stock effect.
  // If the product no longer exists, the log is still deleted.
  public shared func deleteLog(
    adminUserId : Text,
    logId : Nat,
  ) : async { #ok; #err : Text } {
    switch (UserLib.findUser(users, adminUserId)) {
      case null #err("User not found");
      case (?user) {
        if (not UserLib.isAdminRole(user.role)) {
          #err("Only admins can delete log entries")
        } else {
          switch (LogLib.deleteLog(logs, logId)) {
            case (#err(msg)) #err(msg);
            case (#ok(log)) {
              // Atomically reverse the stock effect (best-effort)
              let _ = ProductLib.reverseLogStock(products, log.productId, log.size, log.logType, log.qty);
              #ok
            };
          }
        }
      };
    }
  };
};
