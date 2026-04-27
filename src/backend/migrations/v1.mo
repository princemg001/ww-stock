import Storage "mo:caffeineai-object-storage/Storage";
import Map "mo:core/Map";
import List "mo:core/List";
import ProductTypes "../types/products";
import LogTypes "../types/logs";
import UserTypes "../types/users";

module {
  // ── Old types (as they existed before this migration) ──────────────────────

  public type OldSize = { #S; #M; #L; #XL; #XXL; #XXXL };
  public type OldSizeMap = { s : Nat; m : Nat; l : Nat; xl : Nat; xxl : Nat; xxxl : Nat };
  public type OldColor = { name : Text; imageUrl : Text };
  public type OldProduct = {
    id : Nat;
    name : Text;
    image : Storage.ExternalBlob;
    sizes : OldSizeMap;
    colors : [OldColor];
  };
  public type OldLogType = { #IN; #OUT };
  public type OldLog = {
    id : Nat;
    productId : Nat;
    productName : Text;
    size : OldSize;
    logType : OldLogType;
    qty : Nat;
    remark : Text;
    userName : Text;
    userId : Text;
    timestamp : Int;
    hasBeenEdited : Bool;
    editedBy : ?Text;
  };

  // ── Actor-level stable state shapes ────────────────────────────────────────

  public type OldActor = {
    users : Map.Map<Text, UserTypes.User>;
    seeded : { var value : Bool };
    products : Map.Map<Nat, OldProduct>;
    nextProductId : { var value : Nat };
    logs : List.List<OldLog>;
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

  public func sizeToText(s : OldSize) : Text {
    switch s {
      case (#S) "S";
      case (#M) "M";
      case (#L) "L";
      case (#XL) "XL";
      case (#XXL) "XXL";
      case (#XXXL) "XXXL";
    };
  };

  public func migrateProduct(old : OldProduct) : ProductTypes.Product {
    {
      id = old.id;
      name = old.name;
      image = old.image;
      availableSizes = ["S", "M", "L", "XL", "XXL", "XXXL"];
      stock = [
        ("S", old.sizes.s),
        ("M", old.sizes.m),
        ("L", old.sizes.l),
        ("XL", old.sizes.xl),
        ("XXL", old.sizes.xxl),
        ("XXXL", old.sizes.xxxl),
      ];
      colors = [];
    };
  };

  public func migrateLog(old : OldLog) : LogTypes.Log {
    {
      id = old.id;
      productId = old.productId;
      productName = old.productName;
      size = sizeToText(old.size);
      logType = switch (old.logType) { case (#IN) #IN; case (#OUT) #OUT };
      qty = old.qty;
      remark = old.remark;
      userName = old.userName;
      userId = old.userId;
      timestamp = old.timestamp;
      hasBeenEdited = old.hasBeenEdited;
      editedBy = old.editedBy;
    };
  };

  // ── Top-level migration entry point ────────────────────────────────────────

  public func run(old : OldActor) : NewActor {
    let newProducts = old.products.map<Nat, OldProduct, ProductTypes.Product>(func(_id, p) { migrateProduct(p) });
    let newLogs = old.logs.map<OldLog, LogTypes.Log>(func(l) { migrateLog(l) });
    {
      users = old.users;
      seeded = old.seeded;
      products = newProducts;
      nextProductId = old.nextProductId;
      logs = newLogs;
      nextLogId = old.nextLogId;
    };
  };
};
