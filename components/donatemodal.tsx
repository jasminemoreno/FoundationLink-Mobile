import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import api, { getImageUrl } from "../services/api";
import type { Campaign } from "../types/donortypes";
import type { PaymentMethod } from "./viewmodal";

type DeliveryMethod = "" | "dropoff" | "pickup";

type PhotoAsset = {
  uri: string;
  name: string;
  type: string;
};

type DonateForm = {
  type: "monetary" | "item" | "both";
  amount: string;
  payment_method_id: number | null;
  proof_photo: PhotoAsset | null;
  item_name: string;
  item_quantity: string;
  item_description: string;
  item_photo: PhotoAsset | null;
  delivery_method: DeliveryMethod;
  delivery_address: string;
  notes: string;
};

type Props = {
  visible: boolean;
  campaign: Campaign | null;
  onClose: () => void;
  onDonated: () => void;
};

const QUICK_AMOUNTS = [100, 250, 500, 1000, 2500, 5000];

function makeInitialForm(campaign: Campaign | null): DonateForm {
  return {
    type: campaign?.type === "item" ? "item" : "monetary",
    amount: "",
    payment_method_id: null,
    proof_photo: null,
    item_name: "",
    item_quantity: "",
    item_description: "",
    item_photo: null,
    delivery_method: "",
    delivery_address: "",
    notes: "",
  };
}

export default function DonateModal({
  visible,
  campaign,
  onClose,
  onDonated,
}: Props) {
  const [form, setForm] = useState<DonateForm>(() => makeInitialForm(campaign));
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // The modal component instance is reused across different campaigns (it never
  // unmounts between opens), so the useState initializer above only runs once.
  // Without this, opening the modal for a new campaign keeps whatever `type`
  // was set for the previous campaign, which is why "item" campaigns could show
  // the monetary form and vice versa. Re-sync whenever it opens for a campaign.
  useEffect(() => {
    if (visible) {
      setForm(makeInitialForm(campaign));
      setErrorMsg("");
    }
  }, [visible, campaign?.id]);

  function update(patch: Partial<DonateForm>) {
    setForm((f) => ({ ...f, ...patch }));
  }

  const selectedPaymentAccount = useMemo(() => {
    if (!form.payment_method_id || !campaign?.accepted_payment_methods)
      return null;
    return (
      campaign.accepted_payment_methods.find(
        (pm: PaymentMethod) => pm.payment_method_id === form.payment_method_id
      ) ?? null
    );
  }, [form.payment_method_id, campaign]);

  const foundationAddress = useMemo(() => {
    const f = campaign?.foundation;
    if (!f) return "";
    return [f.street, f.barangay, f.city_municipality, f.province]
      .filter(Boolean)
      .join(", ");
  }, [campaign]);

  function allowsDelivery(method: "dropoff" | "pickup") {
    const methods = campaign?.accepted_delivery_methods;
    if (!methods || methods.length === 0) return true;
    return methods.includes(method);
  }

  async function pickImage(field: "proof_photo" | "item_photo") {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Permission needed",
        "Please allow photo library access to upload an image."
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    const name = asset.fileName || asset.uri.split("/").pop() || `${field}.jpg`;
    const type = asset.mimeType || "image/jpeg";
    update({ [field]: { uri: asset.uri, name, type } as PhotoAsset });
  }

  function reset() {
    setForm(makeInitialForm(campaign));
    setErrorMsg("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function submit() {
    setErrorMsg("");
    const isMonetary = form.type === "monetary" || form.type === "both";
    const isItem = form.type === "item" || form.type === "both";

    if (isMonetary && !form.amount)
      return setErrorMsg("Please enter a monetary amount.");
    if (isMonetary && !form.payment_method_id)
      return setErrorMsg("Please select a payment method.");
    if (isMonetary && !form.proof_photo)
      return setErrorMsg("Please upload proof of payment.");
    if (isItem && !form.item_name)
      return setErrorMsg("Please enter an item name.");
    if (isItem && !form.item_quantity)
      return setErrorMsg("Please enter a quantity.");
    if (isItem && !form.item_photo)
      return setErrorMsg("Please upload a photo of the item(s).");
    if (isItem && !form.delivery_method)
      return setErrorMsg("Please choose a delivery method for your items.");
    if (form.delivery_method === "pickup" && !form.delivery_address.trim())
      return setErrorMsg("Please enter your pick-up address.");

    if (!campaign) return;

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("campaign_id", String(campaign.id));
      fd.append("type", form.type);

      if (isMonetary) {
        fd.append("amount", String(form.amount));
        fd.append("payment_method_id", String(form.payment_method_id));
        if (form.proof_photo) {
          fd.append("proof_photo", {
            uri: form.proof_photo.uri,
            name: form.proof_photo.name,
            type: form.proof_photo.type,
          } as unknown as Blob);
        }
      }

      if (isItem) {
        fd.append("item_name", form.item_name);
        fd.append("item_quantity", String(form.item_quantity));
        if (form.item_description)
          fd.append("item_description", form.item_description);
        if (form.item_photo) {
          fd.append("item_photo", {
            uri: form.item_photo.uri,
            name: form.item_photo.name,
            type: form.item_photo.type,
          } as unknown as Blob);
        }
        fd.append("delivery_method", form.delivery_method);
        fd.append(
          "delivery_address",
          form.delivery_method === "pickup"
            ? form.delivery_address
            : foundationAddress || ""
        );
      }

      if (form.notes) fd.append("notes", form.notes);

      await api.post("/donor/donate", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      reset();
      onDonated?.();
    } catch (err: unknown) {
      const anyErr = err as {
        response?: {
          data?: { errors?: Record<string, string[]>; message?: string };
        };
      };
      const errors = anyErr.response?.data?.errors;
      setErrorMsg(
        errors
          ? Object.values(errors).flat().join(" · ")
          : anyErr.response?.data?.message || "Failed to submit donation."
      );
    } finally {
      setSaving(false);
    }
  }

  if (!campaign) return null;
  const isMonetary = form.type === "monetary" || form.type === "both";
  const isItem = form.type === "item" || form.type === "both";
  const campThumbUri = getImageUrl(campaign.cover_photo) ?? undefined;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.head}>
            <Text style={styles.headTitle}>Donate to {campaign.title}</Text>
            <TouchableOpacity style={styles.btnClose} onPress={handleClose}>
              <Ionicons name="close" size={16} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* CAMPAIGN INFO */}
            <View style={styles.campInfo}>
              {!!campThumbUri && (
                <Image
                  source={{ uri: campThumbUri }}
                  style={styles.campThumb}
                />
              )}
              <View>
                <Text style={styles.campName}>{campaign.title}</Text>
                <Text style={styles.campFoundation}>
                  {campaign.foundation?.name}
                </Text>
              </View>
            </View>

            {/* TYPE SELECTOR */}
            {campaign.type === "both" && (
              <View style={styles.typeSelect}>
                {(
                  [
                    { key: "monetary", label: "💰 Monetary" },
                    { key: "item", label: "📦 Item" },
                    { key: "both", label: "💰📦 Both" },
                  ] as { key: DonateForm["type"]; label: string }[]
                ).map((t) => (
                  <TouchableOpacity
                    key={t.key}
                    style={[
                      styles.typeBtn,
                      form.type === t.key && styles.typeBtnActive,
                    ]}
                    onPress={() => update({ type: t.key })}
                  >
                    <Text
                      style={[
                        styles.typeBtnText,
                        form.type === t.key && styles.typeBtnTextActive,
                      ]}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* MONETARY FORM */}
            {isMonetary && (
              <View style={styles.formSection}>
                {form.type === "both" && (
                  <View style={styles.sectionLabelPill}>
                    <Text style={styles.sectionLabelText}>
                      💰 Monetary Donation
                    </Text>
                  </View>
                )}

                <View style={styles.quickAmounts}>
                  {QUICK_AMOUNTS.map((amt) => (
                    <TouchableOpacity
                      key={amt}
                      style={[
                        styles.quickBtn,
                        Number(form.amount) === amt && styles.quickBtnActive,
                      ]}
                      onPress={() => update({ amount: String(amt) })}
                    >
                      <Text
                        style={[
                          styles.quickBtnText,
                          Number(form.amount) === amt &&
                            styles.quickBtnTextActive,
                        ]}
                      >
                        ₱{amt.toLocaleString()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.fieldLabel}>Custom Amount (₱)</Text>
                  <TextInput
                    style={styles.input}
                    value={form.amount}
                    onChangeText={(v) =>
                      update({ amount: v.replace(/[^0-9]/g, "") })
                    }
                    placeholder="Enter amount"
                    keyboardType="numeric"
                  />
                </View>

                {/* PAYMENT METHOD */}
                <View style={styles.formGroup}>
                  <Text style={styles.fieldLabel}>
                    Payment Method <Text style={styles.req}>*</Text>
                  </Text>

                  {!campaign.accepted_payment_methods?.length ? (
                    <View style={styles.paymentEmptyHint}>
                      <Text style={styles.paymentEmptyHintText}>
                        This foundation hasn&apos;t set up a payment method yet.
                        Please contact them directly.
                      </Text>
                    </View>
                  ) : (
                    <View style={{ gap: 8, marginBottom: 10 }}>
                      {campaign.accepted_payment_methods.map(
                        (pm: PaymentMethod) => {
                          const id = pm.payment_method_id;
                          const active = form.payment_method_id === id;
                          return (
                            <TouchableOpacity
                              key={id}
                              style={[
                                styles.paymentBtn,
                                active && styles.paymentBtnActive,
                              ]}
                              onPress={() => update({ payment_method_id: id })}
                            >
                              <Text style={styles.paymentIcon}>
                                {pm.icon || "💳"}
                              </Text>
                              <Text style={styles.paymentTitle}>{pm.name}</Text>
                              {active && (
                                <View style={styles.paymentCheck}>
                                  <Ionicons
                                    name="checkmark"
                                    size={12}
                                    color="#fff"
                                  />
                                </View>
                              )}
                            </TouchableOpacity>
                          );
                        }
                      )}
                    </View>
                  )}

                  {!!selectedPaymentAccount && (
                    <View style={styles.accountBox}>
                      <Ionicons name="card-outline" size={13} color="#1a8a52" />
                      <View style={{ marginLeft: 8, flex: 1 }}>
                        <Text style={styles.accountLabel}>
                          Send payment to:
                        </Text>
                        <Text style={styles.accountValue}>
                          {selectedPaymentAccount.account_name} —{" "}
                          {selectedPaymentAccount.account_number}
                        </Text>
                      </View>
                    </View>
                  )}

                  {!!form.payment_method_id && (
                    <View style={[styles.formGroup, { marginTop: 12 }]}>
                      <Text style={styles.fieldLabel}>
                        Proof of Payment <Text style={styles.req}>*</Text>
                      </Text>
                      <TouchableOpacity
                        style={styles.uploadBox}
                        onPress={() => pickImage("proof_photo")}
                      >
                        {form.proof_photo ? (
                          <Image
                            source={{ uri: form.proof_photo.uri }}
                            style={styles.uploadPreview}
                          />
                        ) : (
                          <View style={styles.uploadPlaceholder}>
                            <Ionicons
                              name="image-outline"
                              size={22}
                              color="#94a3b8"
                            />
                            <Text style={styles.uploadPlaceholderText}>
                              Upload screenshot of payment receipt
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            )}

            {form.type === "both" && <View style={styles.sectionDivider} />}

            {/* ITEM FORM */}
            {isItem && (
              <View style={styles.formSection}>
                {form.type === "both" && (
                  <View style={styles.sectionLabelPill}>
                    <Text style={styles.sectionLabelText}>
                      📦 Item Donation
                    </Text>
                  </View>
                )}

                <View style={styles.formGroup}>
                  <Text style={styles.fieldLabel}>
                    Item Name <Text style={styles.req}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={form.item_name}
                    onChangeText={(v) => update({ item_name: v })}
                    placeholder="e.g. Canned goods, Clothes"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.fieldLabel}>
                    Quantity <Text style={styles.req}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={form.item_quantity}
                    onChangeText={(v) =>
                      update({ item_quantity: v.replace(/[^0-9]/g, "") })
                    }
                    placeholder="e.g. 10"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.fieldLabel}>Description</Text>
                  <TextInput
                    style={styles.input}
                    value={form.item_description}
                    onChangeText={(v) => update({ item_description: v })}
                    placeholder="Brief description (optional)"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.fieldLabel}>
                    Photo of Item(s) <Text style={styles.req}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.uploadBox}
                    onPress={() => pickImage("item_photo")}
                  >
                    {form.item_photo ? (
                      <Image
                        source={{ uri: form.item_photo.uri }}
                        style={styles.uploadPreview}
                      />
                    ) : (
                      <View style={styles.uploadPlaceholder}>
                        <Ionicons
                          name="image-outline"
                          size={22}
                          color="#94a3b8"
                        />
                        <Text style={styles.uploadPlaceholderText}>
                          Upload a photo of the item(s)
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* DELIVERY METHOD */}
            {isItem && (
              <View style={styles.formSection}>
                <View style={styles.sectionLabelPill}>
                  <Text style={styles.sectionLabelText}>🚚 Item Delivery</Text>
                </View>

                <View style={{ gap: 10, marginBottom: 12 }}>
                  {allowsDelivery("dropoff") && (
                    <TouchableOpacity
                      style={[
                        styles.deliveryBtn,
                        form.delivery_method === "dropoff" &&
                          styles.deliveryBtnActive,
                      ]}
                      onPress={() => update({ delivery_method: "dropoff" })}
                    >
                      <Text style={styles.deliveryIcon}>🏢</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.deliveryTitle}>Drop Off</Text>
                        <Text style={styles.deliveryDesc}>
                          You personally bring items to the foundation
                        </Text>
                      </View>
                      {form.delivery_method === "dropoff" && (
                        <View style={styles.deliveryCheck}>
                          <Ionicons name="checkmark" size={12} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  )}

                  {allowsDelivery("pickup") && (
                    <TouchableOpacity
                      style={[
                        styles.deliveryBtn,
                        form.delivery_method === "pickup" &&
                          styles.deliveryBtnActive,
                      ]}
                      onPress={() => update({ delivery_method: "pickup" })}
                    >
                      <Text style={styles.deliveryIcon}>🏠</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.deliveryTitle}>Pick Up</Text>
                        <Text style={styles.deliveryDesc}>
                          Foundation will collect items from your location
                        </Text>
                      </View>
                      {form.delivery_method === "pickup" && (
                        <View style={styles.deliveryCheck}>
                          <Ionicons name="checkmark" size={12} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                {form.delivery_method === "dropoff" && !!foundationAddress && (
                  <View style={styles.addressBox}>
                    <Ionicons
                      name="location-outline"
                      size={13}
                      color="#1a8a52"
                    />
                    <View style={{ marginLeft: 8, flex: 1 }}>
                      <Text style={styles.addressLabel}>Drop off at:</Text>
                      <Text style={styles.addressValue}>
                        {foundationAddress}
                      </Text>
                    </View>
                  </View>
                )}

                {form.delivery_method === "pickup" && (
                  <View style={[styles.formGroup, { marginTop: 12 }]}>
                    <Text style={styles.fieldLabel}>
                      Your Pick-up Address <Text style={styles.req}>*</Text>
                    </Text>
                    <TextInput
                      style={styles.input}
                      value={form.delivery_address}
                      onChangeText={(v) => update({ delivery_address: v })}
                      placeholder="Enter your full address for pick-up"
                    />
                  </View>
                )}
              </View>
            )}

            {/* NOTES */}
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Message (optional)</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={form.notes}
                onChangeText={(v) => update({ notes: v })}
                placeholder="Add a note to the foundation..."
                multiline
              />
            </View>

            {!!errorMsg && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.btnCancel} onPress={handleClose}>
              <Text style={styles.btnCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnDonate, saving && { opacity: 0.65 }]}
              onPress={submit}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.btnDonateText}>Submit Donation</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 22,
    maxHeight: "90%",
  },
  head: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  headTitle: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 14,
    color: "#0F2D52",
    flex: 1,
    marginRight: 10,
  },
  btnClose: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },

  campInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  campThumb: { width: 56, height: 48, borderRadius: 8 },
  campName: { fontFamily: "Nunito_700Bold", fontSize: 13, color: "#0F2D52" },
  campFoundation: {
    fontFamily: "Nunito_700Bold",
    fontSize: 11,
    color: "#1a8a52",
    marginTop: 2,
  },

  typeSelect: { flexDirection: "row", gap: 8, marginBottom: 16 },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    alignItems: "center",
  },
  typeBtnActive: { borderColor: "#1a8a52", backgroundColor: "#f0fdf4" },
  typeBtnText: { fontFamily: "Nunito_700Bold", fontSize: 11, color: "#64748b" },
  typeBtnTextActive: { color: "#1a8a52" },

  sectionLabelPill: {
    alignSelf: "flex-start",
    backgroundColor: "#f0fdf4",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  sectionLabelText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 11,
    color: "#1a8a52",
  },
  sectionDivider: {
    borderTopWidth: 1.5,
    borderTopColor: "#e2e8f0",
    borderStyle: "dashed",
    marginVertical: 6,
  },

  formSection: { marginBottom: 16 },

  quickAmounts: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  quickBtn: {
    width: "31%",
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    alignItems: "center",
  },
  quickBtnActive: { borderColor: "#1a8a52", backgroundColor: "#1a8a52" },
  quickBtnText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 12,
    color: "#64748b",
  },
  quickBtnTextActive: { color: "#fff" },

  formGroup: { marginBottom: 14 },
  fieldLabel: {
    fontFamily: "Nunito_700Bold",
    fontSize: 12,
    color: "#475569",
    marginBottom: 6,
  },
  req: { color: "#dc2626" },
  input: {
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 13,
    fontFamily: "Nunito_600SemiBold",
    color: "#0F2D52",
  },
  textarea: { height: 80, textAlignVertical: "top" },

  paymentEmptyHint: {
    backgroundColor: "#fefce8",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: 10,
    padding: 12,
  },
  paymentEmptyHintText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12,
    color: "#92400e",
    lineHeight: 18,
  },

  paymentBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: 10,
  },
  paymentBtnActive: { borderColor: "#1a8a52", backgroundColor: "#f0fdf4" },
  paymentIcon: { fontSize: 18, marginRight: 4 },
  paymentTitle: {
    flex: 1,
    fontFamily: "Nunito_700Bold",
    fontSize: 13,
    color: "#0F2D52",
  },
  paymentCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#1a8a52",
    alignItems: "center",
    justifyContent: "center",
  },

  accountBox: {
    flexDirection: "row",
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 10,
    padding: 12,
    marginTop: 6,
  },
  accountLabel: {
    fontFamily: "Nunito_700Bold",
    fontSize: 10.5,
    color: "#1a8a52",
    marginBottom: 2,
  },
  accountValue: {
    fontFamily: "Nunito_700Bold",
    fontSize: 12,
    color: "#0F2D52",
  },

  uploadBox: {
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
    borderRadius: 12,
    overflow: "hidden",
    minHeight: 70,
  },
  uploadPreview: { width: "100%", height: 140 },
  uploadPlaceholder: {
    height: 90,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 12,
  },
  uploadPlaceholderText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 11.5,
    color: "#94a3b8",
    textAlign: "center",
  },

  deliveryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: 12,
  },
  deliveryBtnActive: { borderColor: "#1a8a52", backgroundColor: "#f0fdf4" },
  deliveryIcon: { fontSize: 22 },
  deliveryTitle: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 13,
    color: "#0F2D52",
    marginBottom: 2,
  },
  deliveryDesc: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 11,
    color: "#64748b",
    lineHeight: 16,
  },
  deliveryCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#1a8a52",
    alignItems: "center",
    justifyContent: "center",
  },

  addressBox: {
    flexDirection: "row",
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
  },
  addressLabel: {
    fontFamily: "Nunito_700Bold",
    fontSize: 10.5,
    color: "#1a8a52",
    marginBottom: 2,
  },
  addressValue: {
    fontFamily: "Nunito_700Bold",
    fontSize: 12,
    color: "#0F2D52",
  },

  errorBox: {
    backgroundColor: "#fff5f5",
    borderWidth: 1,
    borderColor: "#ffd0d0",
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 13,
    marginBottom: 12,
  },
  errorText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12,
    color: "#cc3333",
  },

  actions: { flexDirection: "row", gap: 10, marginTop: 14 },
  btnCancel: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    alignItems: "center",
  },
  btnCancelText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 13,
    color: "#64748b",
  },
  btnDonate: {
    flex: 2,
    paddingVertical: 12,
    backgroundColor: "#1a8a52",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  btnDonateText: { fontFamily: "Nunito_700Bold", fontSize: 13, color: "#fff" },
});
