import Map "mo:core/Map";
import AccessControl "mo:caffeineai-authorization/access-control";
import UserTypes "../types/users";
import UserLib "../lib/users";

mixin (
  accessControlState : AccessControl.AccessControlState,
  users : Map.Map<Text, UserTypes.User>,
  seeded : { var value : Bool },
) {
  public shared ({ caller }) func login(userId : Text, pin : Text) : async ?UserTypes.SessionInfo {
    if (not seeded.value) {
      UserLib.seedDefaultUsers(users);
      seeded.value := true;
    };
    UserLib.authenticate(users, userId, pin)
  };

  public shared func seedUsers() : async () {
    if (not seeded.value) {
      UserLib.seedDefaultUsers(users);
      seeded.value := true;
    };
  };

  // Admin or owner creates a new user account (pin-based). Checks role via users map.
  public shared func createNewUser(
    adminUserId : Text,
    newUserId : Text,
    newPin : Text,
    newName : Text,
    roleText : Text,
  ) : async { #ok : UserTypes.SessionInfo; #err : Text } {
    switch (UserLib.findUser(users, adminUserId)) {
      case null #err("Admin user not found");
      case (?admin) {
        if (not UserLib.isAdminRole(admin.role)) {
          #err("Only admins can create users")
        } else {
          switch (UserLib.findUser(users, newUserId)) {
            case (?_) #err("User ID already exists: " # newUserId);
            case null {
              let role : UserTypes.UserRole = if (roleText == "admin") #admin
                else if (roleText == "owner") #owner
                else #user;
              UserLib.createUser(users, newUserId, newName, newPin, role);
              #ok({ userId = newUserId; userName = newName; role })
            };
          }
        }
      };
    }
  };

  // Admin or owner removes a user by userId. Checks role via users map.
  public shared func removeUser(
    adminUserId : Text,
    targetUserId : Text,
  ) : async { #ok; #err : Text } {
    switch (UserLib.findUser(users, adminUserId)) {
      case null #err("Admin user not found");
      case (?admin) {
        if (not UserLib.isAdminRole(admin.role)) {
          #err("Only admins can remove users")
        } else if (adminUserId == targetUserId) {
          #err("Cannot remove your own account")
        } else {
          UserLib.removeUser(users, targetUserId)
        }
      };
    }
  };

  // List all users — admin or owner only, verified by userId.
  public query func listAllUsers(adminUserId : Text) : async { #ok : [UserTypes.UserPublic]; #err : Text } {
    switch (UserLib.findUser(users, adminUserId)) {
      case null #err("Admin user not found");
      case (?admin) {
        if (not UserLib.isAdminRole(admin.role)) {
          #err("Only admins can list users")
        } else {
          #ok(UserLib.listUsers(users))
        }
      };
    }
  };
};
