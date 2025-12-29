import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  Modal,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";

const API_BASE = "https://web-production-4d583.up.railway.app";

function Btn({ label, onPress, disabled }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.18)",
        backgroundColor: disabled ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.08)",
        marginTop: 10,
      }}
    >
      <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>{label}</Text>
    </Pressable>
  );
}

export default function App() {
  const [note, setNote] = useState("");
  const [reply, setReply] = useState("");
  const [state, setState] = useState("normal");
  const [loading, setLoading] = useState(false);

  const [pendingText, setPendingText] = useState("");
  const [pendingState, setPendingState] = useState("normal");
  const [showConsent, setShowConsent] = useState(false);

  const canSend = useMemo(() => note.trim().length > 0 && !loading, [note, loading]);

  function quick(text) {
    setReply(text);
    setState("normal");
    setNote("");
  }

  async function apiPost(path, body) {
    const res = await fetch(API_BASE + path, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${t}`);
    }
    return res.json();
  }

  async function onTenseHelp() {
    const text = note.trim();
    if (!text || loading) return;

    setLoading(true);
    setReply("");

    try {
      const c = await apiPost("/classify", { text });
      const s = c?.state || "normal";
      setState(s);

      if (s === "normal") {
        // baixa intensidade: resposta direta, curta
        setReply("Entendi. O que pesa mais nisso agora?");
        setLoading(false);
        return;
      }

      // elevado/crítico: pede consentimento (o diferencial)
      setPendingText(text);
      setPendingState(s);
      setShowConsent(true);
      setLoading(false);
    } catch (e) {
      setLoading(false);
      setReply("Falha ao conectar. Confere a URL do Railway e a chave OPENAI_API_KEY.");
    }
  }

  async function runSupportNow() {
    if (!pendingText) return;

    setShowConsent(false);
    setLoading(true);
    setReply("");

    try {
      const r = await apiPost("/respond", { text: pendingText, state: pendingState });
      setReply(r?.reply || "");
      setLoading(false);
      // mantém note como está ou limpa:
      // setNote("");
    } catch (e) {
      setLoading(false);
      setReply("Falha ao gerar resposta. Confere logs no Railway.");
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b0f16" }}>
      <View style={{ flex: 1, padding: 18, paddingTop: 22 }}>
        <Text style={{ color: "white", fontSize: 34, fontWeight: "900" }}>WITH</Text>
        <Text style={{ color: "rgba(255,255,255,0.70)", marginTop: 6 }}>
          Micro-hábitos diários + apoio quando o estado sobe.
        </Text>

        {/* Micro-hábitos */}
        <View style={{ marginTop: 18 }}>
          <Text style={{ color: "rgba(255,255,255,0.88)", fontSize: 16, fontWeight: "800" }}>
            Daily Care
          </Text>

          <Btn
            label="⏸ Pausa rápida (2 min)"
            onPress={() =>
              quick("Ok. Pausa de 2 minutos. Não resolve nada agora. Volta e decide melhor.")
            }
          />
          <Btn label="💧 Água agora" onPress={() => quick("Água agora. Volta em 30 segundos.")} />
          <Btn
            label="🧘 Alongar 30s"
            onPress={() =>
              quick("Levanta e alonga 30 segundos. Ombros, pescoço e costas. Só isso.")
            }
          />
        </View>

        {/* Estado elevado */}
        <View
          style={{
            marginTop: 18,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: "rgba(255,255,255,0.10)",
          }}
        >
          <Text style={{ color: "rgba(255,255,255,0.88)", fontSize: 16, fontWeight: "800" }}>
            Estado emocional elevado
          </Text>

          <Text style={{ color: "rgba(255,255,255,0.62)", marginTop: 6 }}>
            Escreve 1 frase. Eu classifico e só entro com sua permissão.
          </Text>

          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Ex: estou nervoso e no limite agora..."
            placeholderTextColor="rgba(255,255,255,0.35)"
            style={{
              marginTop: 10,
              padding: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.12)",
              color: "white",
              backgroundColor: "rgba(255,255,255,0.05)",
            }}
          />

          <Btn label="⚡ Preciso de ajuda agora" onPress={onTenseHelp} disabled={!canSend} />
        </View>

        {/* Status + loading */}
        <View style={{ marginTop: 14 }}>
          {loading ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <ActivityIndicator />
              <Text style={{ color: "rgba(255,255,255,0.65)" }}>Processando...</Text>
            </View>
          ) : (
            <Text style={{ color: "rgba(255,255,255,0.40)" }}>
              state: {state} • API: {API_BASE.replace("https://", "")}
            </Text>
          )}
        </View>

        {/* Reply */}
        {!!reply && (
          <View
            style={{
              marginTop: 14,
              padding: 14,
              borderRadius: 14,
              backgroundColor: "rgba(255,255,255,0.06)",
            }}
          >
            <Text style={{ color: "white", fontSize: 16, lineHeight: 22 }}>{reply}</Text>
          </View>
        )}

        {/* Consent Modal */}
        <Modal visible={showConsent} transparent animationType="fade">
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.55)",
              justifyContent: "center",
              padding: 18,
            }}
          >
            <View
              style={{
                backgroundColor: "#111827",
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.10)",
              }}
            >
              <Text style={{ color: "white", fontSize: 16, fontWeight: "800" }}>
                Estado elevado detectado
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.70)", marginTop: 8 }}>
                Quer apoio agora?
              </Text>

              <Btn label="Agora" onPress={runSupportNow} />
              <Btn
                label="Depois"
                onPress={() => {
                  setShowConsent(false);
                  setReply("Fechado. Quando quiser, aperta de novo.");
                }}
              />
              <Btn
                label="Ignorar"
                onPress={() => {
                  setShowConsent(false);
                  setReply("");
                }}
              />
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}
