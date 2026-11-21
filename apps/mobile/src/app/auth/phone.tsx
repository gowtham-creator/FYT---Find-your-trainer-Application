import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { normalizeIndianPhone } from "@fyt/domain";
import { backend, BackendError } from "../../backend";
import { Button, FadeUp, FytLogo, Icon, Screen, TextField, Txt } from "../../components";
import { OpenDemos } from "../../features/auth/AuthAside";
import { appEnv } from "../../config/env";
import { messageFor } from "../../lib/messages";
import { useSessionStore } from "../../session/store";
import { usePalette, useTwoPane } from "../../theme";

/**
 * S05 Sign in, which is also the welcome: one screen, no tour, no social
 * proof. Under the form, this week's open demos show what the app is for
 * (in the right pane on an iPhone Duo inner display).
 */
export default function PhoneEntry() {
  const p = usePalette();
  const router = useRouter();
  const set = useSessionStore((s) => s.set);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const digits = value.replace(/\D/g, "");
  const valid = /^[6-9]\d{9}$/.test(digits);

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
    if (!phone) return setError("Enter the 10-digit number. It starts with 6, 7, 8 or 9.");
    setError(null);
    send.mutate(phone);
  };

  const twoPane = useTwoPane();
  return (
    <Screen
      aside={<OpenDemos />}
      footer={
        <View style={styles.footer}>
          <Button label="Send code" onPress={submit} disabled={!valid} loading={send.isPending} />
          <Txt variant="caption" tone="ink3" style={styles.center}>
            By continuing you agree to the <Txt variant="caption" tone="accent">Terms</Txt> and <Txt variant="caption" tone="accent">Privacy Policy</Txt>.
          </Txt>
        </View>
      }
    >
      <FadeUp index={0} style={styles.hero}>
        <FytLogo height={40} />
        <View style={styles.headline}>
          <Txt variant="display" accessibilityRole="header">
            Try the class before you pay the fee.
          </Txt>
          <Txt variant="bodyLg" tone="ink2">
            Free demo classes from Hyderabad institutes and trainers: MERN, Java, DevOps, data science and testing. On Google Meet or in the classroom.
          </Txt>
        </View>
      </FadeUp>
      <FadeUp index={1} style={styles.form}>
        <TextField
          label="Mobile number"
          value={value}
          onChangeText={(t) => {
            setValue(t.replace(/[^\d\s]/g, ""));
            if (error) setError(null);
          }}
          keyboardType="number-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          maxLength={11}
          placeholder="98765 43210"
          returnKeyType="send"
          onSubmitEditing={submit}
          error={error}
          hint="We'll text you a 6-digit code. There's no password."
          mono
          prefix={
            <View style={[styles.prefix, { borderRightColor: p.line }]}>
              <Txt variant="mono" tone="ink2">
                +91
              </Txt>
            </View>
          }
        />
        {appEnv.authBypass ? (
          <View style={styles.dev}>
            <Icon name="info" size={16} color={p.ink3} />
            <Txt variant="caption" tone="ink3" style={styles.flex}>
              Dev build, no SMS is sent. Code <Txt variant="caption" mono tone="ink2">123456</Txt>. <Txt variant="caption" mono tone="ink2">90000 00001</Txt> signs in a student, <Txt variant="caption" mono tone="ink2">90000 00002</Txt> a working professional.
            </Txt>
          </View>
        ) : null}
      </FadeUp>
      {twoPane ? null : (
        <View style={[styles.preview, { borderTopColor: p.line }]}>
          <OpenDemos />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: { gap: 32, paddingTop: 8 },
  headline: { gap: 12, maxWidth: 560 },
  form: { gap: 12, paddingTop: 8 },
  prefix: { paddingRight: 10, borderRightWidth: 1 },
  dev: { flexDirection: "row", gap: 6, alignItems: "flex-start" },
  preview: { marginTop: 16, paddingTop: 24, borderTopWidth: StyleSheet.hairlineWidth },
  footer: { gap: 12 },
  center: { textAlign: "center" },
});
