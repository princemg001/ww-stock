import CommonTypes "common";

module {
  public type LogType = { #IN; #OUT };

  // size is a plain Text label matching the product's availableSizes entries.
  public type Log = {
    id : CommonTypes.LogId;
    productId : CommonTypes.ProductId;
    productName : Text;
    size : Text;
    logType : LogType;
    qty : Nat;
    remark : Text;
    userName : Text;
    userId : Text;
    timestamp : CommonTypes.Timestamp;
    hasBeenEdited : Bool;
    editedBy : ?Text;
  };
};
