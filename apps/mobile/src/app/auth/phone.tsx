import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { normalizeIndianPhone } from "@fyt/domain";
import { backend, BackendError } from "../../backend";
import { Button, Screen, TextField, Txt, Wordmark } from "../../components";
import { appEnv } from "../../config/env";
import { messageFor } from "../../lib/messages";
import { useSessionStore } from "../../session/store";
import { usePalette } from "../../theme";

export default function PhoneEntry() {
  const p = usePalette();
  const router = useRouter();
  const set = useSessionStore((s) => s.set);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const send = useMutation({
    mutationFn: (phone: string) => backend().sendCode(phone),
    onSuccess: (_d, phone) => {
      set({ pendingPhone: phone });
      router.push("/auth/otp");
    },
    onError: (e) => setError(messageFor(e instanceof BackendError ? e.code : undefined)),
  });

  const submit = () => {
    const phone = normalizeIndianPhone(value);
    if (!phone) return setError("Enter a 10-digit Indian mobile number starting with 6, 7, 8 or 9.");
    setError(null);
    send.mutate(phone);
  };

  return (
    <Screen footer={<Button label="Send code" onPress={submit} loading={send.isPending} />}>
      <View style={styles.hero}>
        <Wordmark />
        <Txt variant="headline" accessibilityRole="header">
          Find the right trainer, mentor or course
        </Txt>
        <Txt variant="body" tone="ink2">
          {"Sign in with your mobile number. We'll text you a 6-digit code."}
        </Txt>
      </View>
      <TextField
        label="Mobile number"
        value={value}
        onChangeText={(t) => {
          setValue(t.replace(/[^\d\s+]/g, ""));
          if (error) setError(null);
        }}
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        autoComplete="tel"
        maxLength={16}
        placeholder="90000 00000"
        returnKeyType="send"
        onSubmitEditing={submit}
        error={error}
        hint="Indian numbers only for now."
        mono
        prefix={
          <View style={[styles.prefix, { borderRightColor: p.line }]}>
            <Txt variant="body" mono tone="ink2">
              +91
            </Txt>
          </View>
        }
      />
      {appEnv.authBypass ? (
        <Txt variant="caption" tone="info">
          Dev bypass is on: no SMS is sent and the code is 123456. Try 90000 00001 (student), 00002 (corporate), 00003 (new) or 00004 (blocked).
        </Txt>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: 12, paddingTop: 24, paddingBottom: 8 },
  prefix: { paddingRight: 8, borderRightWidth: 1 },
});
