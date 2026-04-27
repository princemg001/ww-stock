import Storage "mo:caffeineai-object-storage/Storage";
import Map "mo:core/Map";
import List "mo:core/List";
import ProductTypes "../types/products";
import LogTypes "../types/logs";
import UserTypes "../types/users";

module {
  // ── Old types (intermediate state: had availableSizes + stock + colors) ──────

  public type OldColor = { name : Text; imageUrl : Text };
  public type OldProduct = {
    id : Nat;
    name : Text;
    image : Storage.ExternalBlob;
    availableSizes : [Text];
    stock : [(Text, Nat)];
    colors : [OldColor];
  };

  // ── Actor-level stable state shapes ────────────────────────────────────────

  public type OldActor = {
    users : Map.Map<Text, UserTypes.User>;
    seeded : { var value : Bool };
    products : Map.Map<Nat, OldProduct>;
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

  public func migrateProduct(old : OldProduct) : ProductTypes.Product {
    {
      id = old.id;
      name = old.name;
      image = old.image;
      availableSizes = old.availableSizes;
      stock = old.stock;
      colors = old.colors;
    };
  };

  // ── Top-level migration entry point ────────────────────────────────────────

  public func run(old : OldActor) : NewActor {
    let newProducts = old.products.map<Nat, OldProduct, ProductTypes.Product>(func(_id, p) { migrateProduct(p) });
    {
      users = old.users;
      seeded = old.seeded;
      products = newProducts;
      nextProductId = old.nextProductId;
      logs = old.logs;
      nextLogId = old.nextLogId;
    };
  };
};
