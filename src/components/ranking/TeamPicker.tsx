"use client";

import { useId, useRef, useState } from "react";
import { TeamCrest } from "@/components/ranking/TeamCrest";
import { normalizeTeamName, cleanTeamName, TEAM_NAME_MAX, type TeamChoice } from "@/lib/teamNames";

export type TeamPickerValue = { choice: TeamChoice; label: string; logoUrl?: string | null };

type Suggestion = { id: string; name: string; city: string | null; logoUrl: string | null };

const INDEPENDENT_LOGO = "/pwa/icon-192.png";

// Campo "Sua equipe": sugere as equipes cadastradas enquanto a pessoa digita, oferece
// "Independente" e permite cadastrar uma equipe nova (nome + Instagram).
export function TeamPicker({
  value,
  onChange,
  label = "Sua equipe (academia, box ou grupo)",
}: {
  value: TeamPickerValue | null;
  onChange: (value: TeamPickerValue | null) => void;
  label?: string;
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const lastQuery = useRef("");
  const listId = useId();
  const inputId = useId();

  function search(text: string) {
    setQuery(text);
    setOpen(true);
    window.clearTimeout(timer.current);
    const key = normalizeTeamName(text);
    if (key.length < 2) {
      setSuggestions([]);
      return;
    }
    timer.current = window.setTimeout(() => {
      lastQuery.current = text;
      fetch(`/api/teams/search?q=${encodeURIComponent(text)}`)
        .then((response) => (response.ok ? response.json() : { teams: [] }))
        .then((data: { teams?: Suggestion[] }) => {
          if (lastQuery.current === text) setSuggestions(Array.isArray(data.teams) ? data.teams : []);
        })
        .catch(() => setSuggestions([]));
    }, 250);
  }

  function pick(next: TeamPickerValue) {
    onChange(next);
    setOpen(false);
    setQuery("");
    setSuggestions([]);
  }

  if (value) {
    return (
      <div className="flex flex-col gap-1 text-xs">
        <span className="text-zinc-400">{label}</span>
        <div className="rounded-xl border border-orange-500/40 bg-orange-500/5 p-3">
          <div className="flex items-center gap-3">
            <TeamCrest name={value.label} logoUrl={value.logoUrl} size={32} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{value.label}</p>
            </div>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="rounded-full border border-white/15 px-3 py-1 text-[11px] text-zinc-300 hover:border-orange-500 hover:text-white"
            >
              Trocar
            </button>
          </div>
          {"newTeam" in value.choice && (
            <label className="mt-3 flex flex-col gap-1">
              <span className="text-zinc-400">Instagram da equipe</span>
              <input
                value={value.choice.newTeam.instagram}
                placeholder="@suaequipe"
                maxLength={40}
                onChange={(event) =>
                  "newTeam" in value.choice &&
                  onChange({
                    ...value,
                    choice: { newTeam: { name: value.choice.newTeam.name, instagram: event.target.value } },
                  })
                }
                className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-zinc-100 outline-none focus:border-orange-500"
              />
            </label>
          )}
        </div>
      </div>
    );
  }

  const typed = cleanTeamName(query);
  const typedKey = normalizeTeamName(typed);
  const exact = suggestions.some((team) => normalizeTeamName(team.name) === typedKey);

  return (
    <div className="relative flex flex-col gap-1 text-xs">
      <label htmlFor={inputId} className="text-zinc-400">
        {label}
      </label>
      <input
        id={inputId}
        value={query}
        placeholder="Digite o nome da sua academia, box ou grupo"
        maxLength={TEAM_NAME_MAX}
        onChange={(event) => search(event.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        role="combobox"
        aria-controls={listId}
        aria-expanded={open}
        aria-autocomplete="list"
        className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-zinc-100 outline-none focus:border-orange-500"
      />
      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-auto rounded-xl border border-white/10 bg-zinc-950 p-1 shadow-xl"
        >
          {suggestions.map((team) => (
            <li key={team.id}>
              <button
                type="button"
                role="option"
                aria-selected={false}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => pick({ choice: { teamId: team.id }, label: team.name, logoUrl: team.logoUrl })}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-white/5"
              >
                <TeamCrest name={team.name} logoUrl={team.logoUrl} size={24} />
                <span className="text-sm text-white">{team.name}</span>
                {team.city && <span className="text-[11px] text-zinc-500">· {team.city}</span>}
              </button>
            </li>
          ))}
          {typedKey.length >= 2 && !exact && (
            <li>
              <button
                type="button"
                role="option"
                aria-selected={false}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => pick({ choice: { newTeam: { name: typed, instagram: "" } }, label: typed })}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-orange-300 hover:bg-white/5"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-orange-400/60 text-sm">+</span>
                <span className="text-sm">
                  Cadastrar nova equipe: <strong className="text-white">{typed}</strong>
                </span>
              </button>
            </li>
          )}
          <li>
            <button
              type="button"
              role="option"
              aria-selected={false}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => pick({ choice: { independent: true }, label: "Independentes", logoUrl: INDEPENDENT_LOGO })}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-white/5"
            >
              <TeamCrest name="Independentes" logoUrl={INDEPENDENT_LOGO} size={24} />
              <span className="text-sm text-white">Independente</span>
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
