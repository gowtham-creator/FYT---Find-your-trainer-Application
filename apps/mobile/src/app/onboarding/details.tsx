import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { DEFAULT_CONFIG_PUBLIC, type SaveProfileRequest } from "@fyt/domain";
import { backend, BackendError } from "../../backend";
import { Button, Chip, Screen, TextField, Txt } from "../../components";
import { messageFor } from "../../lib/messages";
import { useSessionStore } from "../../session/store";

const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

/**
 * Onboarding step 2: the segment's required details only (APP-ARCHITECTURE §7.1).
 * Validation is the shared @fyt/domain rule, run again by saveProfileV1.
 * Optional fields (area, email, education, experience) arrive with the full forms in Milestone 3.
 */
export default function Details() {
  const router = useRouter();
  const user = useSessionStore((s) => s.userDoc);
  const taxonomy = useSessionStore((s) => s.config?.taxonomy) ?? DEFAULT_CONFIG_PUBLIC.taxonomy;
  const student = user?.segment !== "corporate";
  const [name, setName] = useState(user?.name ?? "");
  const [institution, setInstitution] = useState(user?.institution ?? "");
  const [currentRole, setCurrentRole] = useState(user?.currentRole ?? "");
  const [years, setYears] = useState(user?.yearsExperience?.toString() ?? "");
  const [interests, setInterests] = useState<string[]>(user?.interests ?? []);
  const [skills, setSkills] = useState<string[]>(user?.skillsToLearn ?? []);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const save = useMutation({
    mutationFn: (req: SaveProfileRequest) => backend().saveProfile(req),
    onError: (e) => setErrors(e instanceof BackendError && e.fieldErrors ? e.fieldErrors : { _: [messageFor(e instanceof BackendError ? e.code : undefined)] }),
  });

  const submit = () => {
    setErrors({});
    const yearsNum = years.trim() === "" ? undefined : Number.parseInt(years, 10);
    save.mutate(
      student
        ? { step: "details", name, institution, interests, skillsToLearn: skills }
        : { step: "details", name, currentRole, yearsExperience: Number.isNaN(yearsNum) ? undefined : yearsNum, skillsToLearn: skills },
    );
  };
  const err = (k: string) => errors[k]?.[0] ?? null;

  return (
    <Screen footer={<Button label="Continue" onPress={submit} loading={save.isPending} />}>
      <View style={styles.head}>
        <Txt variant="eyebrow" tone="ink3">
          Step 2 of 2 · {student ? "Student" : "Working professional"}
        </Txt>
        <Txt variant="headline" accessibilityRole="header">
          A few details
        </Txt>
      </View>
      <TextField label="Your name" value={name} onChangeText={setName} autoComplete="name" textContentType="name" error={err("name")} />
      {student ? (
        <TextField label="College or school" value={institution} onChangeText={setInstitution} error={err("institution")} />
      ) : (
        <>
          <TextField label="Current role" value={currentRole} onChangeText={setCurrentRole} error={err("currentRole")} />
          <TextField label="Years of experience" value={years} onChangeText={(t) => setYears(t.replace(/\D/g, "").slice(0, 2))} keyboardType="number-pad" error={err("yearsExperience")} mono />
        </>
      )}
      {student ? (
        <View style={styles.group}>
          <Txt variant="caption" tone="ink2">
            Course interests
          </Txt>
          <View style={styles.chips}>
            {taxonomy.categories.map((c) => (
              <Chip key={c} label={c} selected={interests.includes(c)} onPress={() => setInterests((l) => toggle(l, c))} />
            ))}
          </View>
          {err("interests") ? <Txt variant="caption" tone="bad">{err("interests")}</Txt> : null}
        </View>
      ) : null}
      <View style={styles.group}>
        <Txt variant="caption" tone="ink2">
          {student ? "Tech skills you want" : "Tech stack to learn"}
        </Txt>
        <View style={styles.chips}>
          {taxonomy.techStacks.map((c) => (
            <Chip key={c} label={c} selected={skills.includes(c)} onPress={() => setSkills((l) => toggle(l, c))} />
          ))}
        </View>
        {err("skillsToLearn") ? <Txt variant="caption" tone="bad">{err("skillsToLearn")}</Txt> : null}
      </View>
      {err("_") ? <Txt variant="caption" tone="bad">{err("_")}</Txt> : null}
      <Button variant="ghost" label="Change student / professional" onPress={() => router.replace("/onboarding/segment")} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { gap: 8, paddingTop: 24 },
  group: { gap: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
