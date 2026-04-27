import Map "mo:core/Map";
import List "mo:core/List";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import MixinObjectStorage "mo:caffeineai-object-storage/Mixin";
import CommonTypes "types/common";
import ProductTypes "types/products";
import LogTypes "types/logs";
import UserTypes "types/users";
import UsersMixin "mixins/users-api";
import ProductsMixin "mixins/products-api";
import LogsMixin "mixins/logs-api";
import _MigrationV1 "migrations/v1";
import _MigrationV2 "migrations/v2";
import MigrationV3 "migrations/v3";


(with migration = MigrationV3.run)
actor {
  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Object storage
  include MixinObjectStorage();

  // Users state
  let users = Map.empty<Text, UserTypes.User>();
  let seeded = { var value = false };

  // Products state
  let products = Map.empty<CommonTypes.ProductId, ProductTypes.Product>();
  let nextProductId = { var value : Nat = 1 };

  // Logs state
  let logs = List.empty<LogTypes.Log>();
  let nextLogId = { var value : Nat = 1 };

  // Mixins
  // UsersMixin: login (pin-based), seedUsers, createNewUser, removeUser, listAllUsers
  include UsersMixin(accessControlState, users, seeded);
  // ProductsMixin: getProducts, getProduct, addProduct, getTotalProducts, getTotalStock, updateStock, updateProduct
  include ProductsMixin(users, products, logs, nextProductId, nextLogId);
  // LogsMixin: getLogs (all users), updateLog (own once / admin any), deleteLog (admin only, reverses stock)
  include LogsMixin(users, products, logs);
};
