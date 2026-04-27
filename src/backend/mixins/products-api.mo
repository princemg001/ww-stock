import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Storage "mo:caffeineai-object-storage/Storage";
import CommonTypes "../types/common";
import ProductTypes "../types/products";
import LogTypes "../types/logs";
import UserTypes "../types/users";
import ProductLib "../lib/products";
import LogLib "../lib/logs";
import UserLib "../lib/users";

mixin (
  users : Map.Map<Text, UserTypes.User>,
  products : Map.Map<CommonTypes.ProductId, ProductTypes.Product>,
  logs : List.List<LogTypes.Log>,
  nextProductId : { var value : Nat },
  nextLogId : { var value : Nat },
) {
  public query func getProducts() : async [ProductTypes.Product] {
    ProductLib.getAll(products)
  };

  public query func getProduct(id : CommonTypes.ProductId) : async ?ProductTypes.Product {
    ProductLib.getById(products, id)
  };

  // addProduct: admin or owner verified via userId; accepts availableSizes and initialStock.
  public shared func addProduct(
    adminUserId : Text,
    name : Text,
    image : Storage.ExternalBlob,
    availableSizes : [Text],
    initialStock : [(Text, Nat)],
  ) : async { #ok : ProductTypes.Product; #err : Text } {
    switch (UserLib.findUser(users, adminUserId)) {
      case null #err("User not found");
      case (?user) {
        if (not UserLib.isAdminRole(user.role)) {
          #err("Only admins can add products")
        } else {
          let product = ProductLib.add(products, nextProductId.value, name, image, availableSizes, initialStock);
          nextProductId.value += 1;
          #ok(product)
        }
      };
    }
  };

  public query func getTotalProducts() : async Nat {
    ProductLib.totalCount(products)
  };

  public query func getTotalStock() : async Nat {
    ProductLib.totalStock(products)
  };

  // updateStock accepts sizeChanges with Text size labels — supports any custom size including XS.
  public shared func updateStock(
    productId : CommonTypes.ProductId,
    sizeChanges : [CommonTypes.SizeChange],
    remark : Text,
    userId : Text,
    userName : Text,
  ) : async ProductTypes.StockUpdateResult {
    switch (ProductLib.getById(products, productId)) {
      case null #err("Product not found");
      case (?product) {
        switch (ProductLib.applySizeChanges(product.stock, sizeChanges)) {
          case (#err(msg)) #err(msg);
          case (#ok(newStock)) {
            let updated : ProductTypes.Product = { product with stock = newStock };
            products.add(productId, updated);

            // Create a log entry for each size change
            for (change in sizeChanges.values()) {
              if (change.inQty > 0) {
                let _ = LogLib.addLog(logs, nextLogId.value, productId, product.name, change.size, #IN, change.inQty, remark, userName, userId, Time.now());
                nextLogId.value += 1;
              } else if (change.outQty > 0) {
                let _ = LogLib.addLog(logs, nextLogId.value, productId, product.name, change.size, #OUT, change.outQty, remark, userName, userId, Time.now());
                nextLogId.value += 1;
              };
            };

            #ok(updated)
          };
        }
      };
    }
  };

  // Admin or owner updates product name, image, and/or available sizes.
  public shared func updateProduct(
    adminUserId : Text,
    productId : CommonTypes.ProductId,
    newName : ?Text,
    newImage : ?Storage.ExternalBlob,
    newAvailableSizes : ?[Text],
  ) : async { #ok : ProductTypes.Product; #err : Text } {
    switch (UserLib.findUser(users, adminUserId)) {
      case null #err("User not found");
      case (?user) {
        if (not UserLib.isAdminRole(user.role)) {
          #err("Only admins can update products")
        } else {
          switch (ProductLib.updateProduct(products, productId, newName, newImage, newAvailableSizes)) {
            case null #err("Product not found");
            case (?updated) #ok(updated);
          }
        }
      };
    }
  };
};
