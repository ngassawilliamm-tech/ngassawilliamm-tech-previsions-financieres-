import { useState } from "react";
import { router } from "expo-router";
import { supabase } from "../lib/supabase";
import { Screen, Title, Muted, Field, Btn, ErrorText, Row, Chip } from "../components/ui";
import { Seo } from "../lib/seo";

// Connexion par e-mail et mot de passe (le code par e-mail reviendra avec un service d'envoi d'e-mails dédié)
export default function Connexion() {
  const [mode, setMode] = useState("connexion");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [password2, setPassword2] = useState("");
  const [err, setErr] = useState(""); const [info, setInfo] = useState(""); const [busy, setBusy] = useState(false);

  async function submit() {
    setErr(""); setInfo(""); const e = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return setErr("Indique une adresse e-mail valide.");
    if (password.length < 8) return setErr("Le mot de passe doit faire au moins 8 caractères.");
    if (mode === "inscription" && password !== password2) return setErr("Les deux mots de passe ne sont pas identiques.");
    setBusy(true);
    if (mode === "inscription") {
      const { data, error } = await supabase.auth.signUp({ email: e, password });
      setBusy(false);
      if (error) return setErr(error.message.includes("registered") ? "Un compte existe déjà avec cette adresse : connecte-toi." : "Le compte n'a pas pu être créé. Réessaie dans un instant.");
      if (!data.session) { setInfo("Compte créé. Ouvre l'e-mail de confirmation, clique sur le lien, puis reviens te connecter ici."); setMode("connexion"); return; }
      router.back();
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: e, password });
      setBusy(false);
      if (error) return setErr(error.message.includes("confirm") ? "Confirme d'abord ton adresse avec le lien reçu par e-mail." : "E-mail ou mot de passe incorrect.");
      router.back();
    }
  }

  async function forgot() {
    setErr(""); const e = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return setErr("Indique d'abord ton adresse e-mail.");
    await supabase.auth.resetPasswordForEmail(e);
    setInfo("Si un compte existe, un e-mail pour changer le mot de passe vient d'être envoyé.");
  }

  return (
    <Screen>
      <Seo title="Connexion" noindex />
      <Title size={26}>{mode === "connexion" ? "Connexion à Kitoko" : "Créer mon compte"}</Title>
      <Row>
        <Chip label="J'ai un compte" active={mode === "connexion"} onPress={() => { setMode("connexion"); setErr(""); }} />
        <Chip label="Créer un compte" active={mode === "inscription"} onPress={() => { setMode("inscription"); setErr(""); }} />
      </Row>
      <Field label="Adresse e-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="prenom@exemple.be" />
      <Field label="Mot de passe (8 caractères minimum)" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" />
      {mode === "inscription" ? <Field label="Confirme le mot de passe" value={password2} onChangeText={setPassword2} secureTextEntry autoCapitalize="none" /> : null}
      <ErrorText>{err}</ErrorText>
      {info ? <Muted>{info}</Muted> : null}
      <Btn title={mode === "connexion" ? "Me connecter" : "Créer mon compte"} onPress={submit} loading={busy} />
      {mode === "connexion" ? <Btn kind="ghost" title="Mot de passe oublié" onPress={forgot} /> : null}
    </Screen>
  );
}
