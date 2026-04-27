module {
  public type UserRole = { #admin; #owner; #user };

  public type User = {
    userId : Text;
    userName : Text;
    pin : Text;
    role : UserRole;
  };

  public type UserPublic = {
    userId : Text;
    userName : Text;
    role : UserRole;
  };

  public type SessionInfo = {
    userId : Text;
    userName : Text;
    role : UserRole;
  };
};
