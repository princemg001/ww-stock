import Storage "mo:caffeineai-object-storage/Storage";
import Map "mo:core/Map";
import List "mo:core/List";
import ProductTypes "../types/products";
import LogTypes "../types/logs";
import UserTypes "../types/users";

module {
  // ── Old types (UserRole without #owner) ────────────────────────────────────

  public type OldUserRole = { #admin; #owner; #user };
  public type OldUser = {
    userId : Text;
    userName : Text;
    pin : Text;
    role : OldUserRole;
  };

  // ── Actor-level stable state shapes ────────────────────────────────────────

  public type OldActor = {
    users : Map.Map<Text, OldUser>;
    seeded : { var value : Bool };
    products : Map.Map<Nat, ProductTypes.Product>;
    nextProductId : { var value : Nat };
    logs : List.List<LogTypes.Log>;
    nextLogId : { var value : Nat };
  };

  public type NewActor = {
    users : Map.Map<Text, UserTypes.User>;
    seeded : { var value : Bool };
    products : Map.Map<Nat, ProductTypes.Product>;
    nextProductId : { var value : Nat };
    logs : List.List<LogTypes.Log>;
    nextLogId : { var value : Nat };
  };

  // ── Per-item converters ─────────────────────────────────────────────────────

  public func migrateUser(old : OldUser) : UserTypes.User {
    let newRole : UserTypes.UserRole = switch (old.role) {
      case (#admin) #admin;
      case (#owner) #owner;
      case (#user) #user;
    };
    { userId = old.userId; userName = old.userName; pin = old.pin; role = newRole };
  };

  // ── Top-level migration entry point ────────────────────────────────────────

  public func run(old : OldActor) : NewActor {
    let newUsers = old.users.map<Text, OldUser, UserTypes.User>(func(_id, u) { migrateUser(u) });
    {
      users = newUsers;
      seeded = old.seeded;
      products = old.products;
      nextProductId = old.nextProductId;
      logs = old.logs;
      nextLogId = old.nextLogId;
    };
  };
};
