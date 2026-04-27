import Storage "mo:caffeineai-object-storage/Storage";

module {
  // ProductColor is kept for stable-state backward compatibility.
  // The frontend no longer uses colors, but removing this field would break
  // the stable variable upgrade from canister versions that stored colors.
  public type ProductColor = {
    name : Text;
    imageUrl : Text;
  };

  // Product stores:
  //   availableSizes — ordered list of size labels admin defined at creation time
  //                    (e.g. ["SX","S","M","L","XL","XXL","XXXL"])
  //   stock          — parallel array of (sizeName, qty) pairs; same order as availableSizes
  //   colors         — kept for stable compatibility; always empty [] for new products
  public type Product = {
    id : Nat;
    name : Text;
    image : Storage.ExternalBlob;
    availableSizes : [Text];
    stock : [(Text, Nat)];
    colors : [ProductColor];
  };

  public type AddProductArgs = {
    name : Text;
    image : Storage.ExternalBlob;
    availableSizes : [Text];
    initialStock : [(Text, Nat)];
  };

  public type StockUpdateResult = {
    #ok : Product;
    #err : Text;
  };
};
