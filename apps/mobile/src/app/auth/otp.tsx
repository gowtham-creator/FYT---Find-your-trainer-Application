import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState, type ComponentRef } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { formatIndianPhone } from "@fyt/domain";
import { backend, BackendError } from "../../backend";
import { Button, Screen, TextLink, TopBar, Txt } from "../../components";
import { NextSteps } from "../../features/auth/AuthAside";
import { messageFor } from "../../lib/messages";
import { useSessionStore } from "../../session/store";
import { font, radius, usePalette } from "../../theme";

const LENGTH = 6;
const COOLDOWN_S = 30;
const MAX_RESENDS = 3;

export default function OtpVerify() {
  const p = usePalette();
  const router = useRouter();
  const phone = useSessionStore((s) => s.pendingPhone);
  const set = useSessionStore((s) => s.set);
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(COOLDOWN_S);
  const [resends, setResends] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const verify = useMutation({
    mutationFn: (c: string) => backend().confirmCode(c),
    // On success the auth listener updates the session and the router moves on.
    onError: (e) => {
      const codeStr = e instanceof BackendError ? e.code : undefined;
      if (codeStr === "auth/user-disabled") return set({ authDisabled: true });
      setError(messageFor(codeStr));
      setCode("");
      input.current?.focus();
    },
  });

  const resend = useMutation({
    mutationFn: () => backend().sendCode(phone!),
    onSuccess: () => {
      setResends((n) => n + 1);
      setCooldown(COOLDOWN_S);
      setError(null);
    },
    onError: (e) => setError(messageFor(e instanceof BackendError ? e.code : undefined)),
  });

  if (!phone) {
    return (
      <Screen>
        <Txt variant="body">We need your mobile number before we can send a code.</Txt>
        <Button label="Enter your number" onPress={() => router.replace("/auth/phone")} />
      </Screen>
    );
  }

  const onChange = (t: string) => {
    const digits = t.replace(/\D/g, "").slice(0, LENGTH);
    setCode(digits);
    if (error) setError(null);
    if (digits.length === LENGTH) verify.mutate(digits);
  };

  return (
    <Screen header={<TopBar />} aside={<NextSteps step={1} />} footer={<Button label="Verify and continue" onPress={() => verify.mutate(code)} disabled={code.length !== LENGTH} loading={verify.isPending} />}>
      <View style={styles.head}>
        <Txt variant="display" accessibilityRole="header">
          Enter the code we sent
        </Txt>
        <Txt variant="bodyLg" tone="ink2">
          It went by SMS to{" "}
          <Txt variant="bodyLg" mono tone="ink">
            {formatIndianPhone(phone)}
          </Txt>
          . It can take up to a minute.
        </Txt>
        <TextLink label="Wrong number? Change it" onPress={() => router.replace("/auth/phone")} />
      </View>

      <Pressable onPress={() => input.current?.focus()} accessibilityLabel={`Code, ${code.length} of ${LENGTH} digits entered`}>
        <View style={styles.cells}>
          {Array.from({ length: LENGTH }, (_, i) => {
            const active = i === code.length && !verify.isPending;
            return (
              <View key={i} style={[styles.cell, { backgroundColor: p.surface, borderColor: error ? p.bad : active ? p.accent : p.lineField, borderWidth: active || error ? 2 : 1 }]}>
                <Txt variant="monoXl" style={{ fontFamily: font.monoMedium }}>
                  {code[i] ?? ""}
                </Txt>
              </View>
            );
          })}
        </View>
        <TextInput
          ref={input}
          value={code}
          onChangeText={onChange}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          maxLength={LENGTH}
          autoFocus
          style={styles.hidden}
          accessibilityLabel="One-time code"
        />
      </Pressable>

      {error ? (
        <Txt variant="caption" tone="bad" accessibilityLiveRegion="polite">
          {error}
        </Txt>
      ) : null}

      <View style={styles.links}>
        {resends >= MAX_RESENDS ? (
          <Txt variant="caption" tone="ink3">
            That was the last resend for now. Check the number, or try again in 10 minutes.
          </Txt>
        ) : cooldown > 0 ? (
          <Txt variant="meta" tone="ink2">
            Didn't get it? Resend in <Txt variant="mono" tone="ink">{`0:${String(cooldown).padStart(2, "0")}`}</Txt>
          </Txt>
        ) : (
          <Button variant="ghost" label="Resend code" onPress={() => resend.mutate()} loading={resend.isPending} />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { gap: 12, paddingTop: 8, paddingBottom: 16, alignItems: "flex-start" },
  cells: { flexDirection: "row", gap: 8 },
  cell: { flex: 1, maxWidth: 56, height: 64, borderRadius: radius.control, alignItems: "center", justifyContent: "center" },
  hidden: { position: "absolute", opacity: 0, width: 1, height: 1 },
  links: { gap: 4, alignItems: "flex-start", paddingTop: 8 },
});
