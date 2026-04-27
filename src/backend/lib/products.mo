import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Storage "mo:caffeineai-object-storage/Storage";
import CommonTypes "../types/common";
import ProductTypes "../types/products";

module {
  // Convert a stock array to a mutable Map for manipulation.
  func stockToMap(stock : [(Text, Nat)]) : Map.Map<Text, Nat> {
    Map.fromArray<Text, Nat>(stock)
  };

  // Convert a Map back to an array.
  func mapToStock(m : Map.Map<Text, Nat>) : [(Text, Nat)] {
    m.entries().toArray()
  };

  public func getAll(products : Map.Map<CommonTypes.ProductId, ProductTypes.Product>) : [ProductTypes.Product] {
    products.values().toArray()
  };

  public func getById(products : Map.Map<CommonTypes.ProductId, ProductTypes.Product>, id : CommonTypes.ProductId) : ?ProductTypes.Product {
    products.get(id)
  };

  public func add(
    products : Map.Map<CommonTypes.ProductId, ProductTypes.Product>,
    nextId : Nat,
    name : Text,
    image : Storage.ExternalBlob,
    availableSizes : [Text],
    initialStock : [(Text, Nat)],
  ) : ProductTypes.Product {
    let product : ProductTypes.Product = {
      id = nextId;
      name;
      image;
      availableSizes;
      stock = initialStock;
      colors = [];
    };
    products.add(nextId, product);
    product
  };

  public func updateSizes(
    products : Map.Map<CommonTypes.ProductId, ProductTypes.Product>,
    id : CommonTypes.ProductId,
    newStock : [(Text, Nat)],
  ) : () {
    switch (products.get(id)) {
      case (?product) {
        let updated = { product with stock = newStock };
        products.add(id, updated);
      };
      case null {};
    }
  };

  public func totalCount(products : Map.Map<CommonTypes.ProductId, ProductTypes.Product>) : Nat {
    products.size()
  };

  public func totalStock(products : Map.Map<CommonTypes.ProductId, ProductTypes.Product>) : Nat {
    var total : Nat = 0;
    for (product in products.values()) {
      for ((_, qty) in product.stock.values()) {
        total += qty;
      };
    };
    total
  };

  // Apply a batch of size changes to a product's current stock.
  // Returns #ok with the updated stock array, or #err with a message.
  public func applySizeChanges(
    currentStock : [(Text, Nat)],
    changes : [CommonTypes.SizeChange],
  ) : { #ok : [(Text, Nat)]; #err : Text } {
    let stockMap = stockToMap(currentStock);

    for (change in changes.values()) {
      if (change.inQty > 0) {
        let current = switch (stockMap.get(change.size)) { case (?v) v; case null 0 };
        stockMap.add(change.size, current + change.inQty);
      } else if (change.outQty > 0) {
        let current = switch (stockMap.get(change.size)) { case (?v) v; case null 0 };
        if (current < change.outQty) {
          return #err("Insufficient stock for size " # change.size # ": have " # debug_show(current) # ", need " # debug_show(change.outQty));
        };
        stockMap.add(change.size, Nat.sub(current, change.outQty));
      };
    };

    #ok(mapToStock(stockMap))
  };

  // Reverse a single log entry's stock effect on a product.
  // IN log → subtract qty; OUT log → add qty back.
  // Returns false if product not found.
  public func reverseLogStock(
    products : Map.Map<CommonTypes.ProductId, ProductTypes.Product>,
    productId : CommonTypes.ProductId,
    size : Text,
    logType : { #IN; #OUT },
    qty : Nat,
  ) : Bool {
    switch (products.get(productId)) {
      case null false;
      case (?product) {
        let stockMap = stockToMap(product.stock);
        let current = switch (stockMap.get(size)) { case (?v) v; case null 0 };
        switch (logType) {
          case (#IN) {
            // Reverse an IN: subtract qty (but don't go negative)
            let newQty = if (current >= qty) Nat.sub(current, qty) else 0;
            stockMap.add(size, newQty);
          };
          case (#OUT) {
            // Reverse an OUT: add qty back
            stockMap.add(size, current + qty);
          };
        };
        let updated = { product with stock = mapToStock(stockMap) };
        products.add(productId, updated);
        true
      };
    }
  };

  // Update a product's name, image, and/or sizes.
  public func updateProduct(
    products : Map.Map<CommonTypes.ProductId, ProductTypes.Product>,
    id : CommonTypes.ProductId,
    newName : ?Text,
    newImage : ?Storage.ExternalBlob,
    newAvailableSizes : ?[Text],
  ) : ?ProductTypes.Product {
    switch (products.get(id)) {
      case null null;
      case (?product) {
        let name = switch (newName) { case (?n) n; case null product.name };
        let image = switch (newImage) { case (?i) i; case null product.image };
        let availableSizes = switch (newAvailableSizes) { case (?s) s; case null product.availableSizes };
        let updated : ProductTypes.Product = { product with name; image; availableSizes };
        products.add(id, updated);
        ?updated
      };
    }
  };
};
