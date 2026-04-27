import Map "mo:core/Map";
import UserTypes "../types/users";

module {
  public func findUser(users : Map.Map<Text, UserTypes.User>, userId : Text) : ?UserTypes.User {
    users.get(userId)
  };

  public func authenticate(users : Map.Map<Text, UserTypes.User>, userId : Text, pin : Text) : ?UserTypes.SessionInfo {
    switch (users.get(userId)) {
      case (?user) {
        if (user.pin == pin) {
          ?{ userId = user.userId; userName = user.userName; role = user.role }
        } else {
          null
        }
      };
      case null null;
    }
  };

  public func createUser(users : Map.Map<Text, UserTypes.User>, userId : Text, userName : Text, pin : Text, role : UserTypes.UserRole) : () {
    let user : UserTypes.User = { userId; userName; pin; role };
    users.add(userId, user);
  };

  public func removeUser(users : Map.Map<Text, UserTypes.User>, userId : Text) : { #ok; #err : Text } {
    switch (users.get(userId)) {
      case (?_) {
        users.remove(userId);
        #ok
      };
      case null #err("User not found: " # userId);
    }
  };

  public func toPublic(user : UserTypes.User) : UserTypes.UserPublic {
    { userId = user.userId; userName = user.userName; role = user.role }
  };

  public func listUsers(users : Map.Map<Text, UserTypes.User>) : [UserTypes.UserPublic] {
    users.values().map<UserTypes.User, UserTypes.UserPublic>(func(u) { toPublic(u) }).toArray()
  };

  public func isAdminRole(role : UserTypes.UserRole) : Bool {
    switch (role) {
      case (#admin or #owner) true;
      case (#user) false;
    }
  };

  public func seedDefaultUsers(users : Map.Map<Text, UserTypes.User>) : () {
    if (users.get("mitul001") == null) {
      createUser(users, "mitul001", "Mitul Gopani", "9157", #admin);
    };
  };
};
