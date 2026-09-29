import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "./api";
import { translate } from "./i18n";
const Context = createContext();
export const useApp = () => useContext(Context);
export function Provider({ children }) {
  const [session, setSession] = useState(null),
    [loading, setLoading] = useState(true),
    [lang, setLang] = useState(localStorage.getItem("jos-language") || "en"),
    [notice, setNotice] = useState(null);
  const refresh = async () => {
    try {
      const s = await api("/me");
      setSession(s);
      setLang(s.user.language || "en");
    } catch {
      setSession(null);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    refresh();
  }, []);
  useEffect(() => {
    document.documentElement.dir = lang === "ur" ? "rtl" : "ltr";
    document.documentElement.lang = lang === "ur" ? "ur" : "en";
    localStorage.setItem("jos-language", lang);
  }, [lang]);
  useEffect(() => {
    if (notice) {
      const t = setTimeout(() => setNotice(null), 6000);
      return () => clearTimeout(t);
    }
  }, [notice]);
  const changeLang = async (l) => {
    setLang(l);
    if (session)
      try {
        await api("/me", { method: "PATCH", body: { language: l } });
      } catch (e) {
        setNotice({ text: e.message, error: true });
      }
  };
  const t = (k) => translate(k, lang);
  const notify = (text, error = false) =>
    setNotice({
      text:
        error &&
        /Too small|Too big|Invalid input|expected |Invalid option/.test(text)
          ? "Please check the entered details."
          : text,
      error,
    });
  return (
    <Context.Provider
      value={{
        session,
        setSession,
        refresh,
        loading,
        lang,
        changeLang,
        t,
        notify,
      }}
    >
      {children}
      {notice && (
        <div className={"toast " + (notice.error ? "error" : "")} role="status">
          {t(notice.text)}
          <button onClick={() => setNotice(null)} aria-label="Close">
            ×
          </button>
        </div>
      )}
    </Context.Provider>
  );
}
