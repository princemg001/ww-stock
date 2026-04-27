module {
  public type Timestamp = Int;
  public type ProductId = Nat;
  public type LogId = Nat;

  // Stock entry for a single size: (sizeName, quantity).
  // Used as array in public API since Map is not a shared type.
  public type SizeEntry = (Text, Nat);

  // A single size change — inQty and outQty are mutually exclusive per call.
  // size is a plain Text label (e.g. "SX", "S", "M", "L", "XL", "XXL", "XXXL")
  // — not a variant, so admins can define any size names at product creation time.
  public type SizeChange = {
    size : Text;
    inQty : Nat;
    outQty : Nat;
  };
};
