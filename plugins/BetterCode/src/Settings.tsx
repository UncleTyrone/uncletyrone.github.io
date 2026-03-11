/// <reference path="../vendetta.d.ts" />
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";
import { Forms, General } from "@vendetta/ui/components";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Linking } from "@vendetta/metro/common";

const ScrollView = General.ScrollView as any;
const FormSection = Forms.FormSection as any;
const FormSwitchRow = Forms.FormSwitchRow as any;
const FormRow = Forms.FormRow as any;
const FormIcon = Forms.FormIcon as any;
const FormInput = Forms.FormInput as any;
const FormRadioRow = Forms.FormRadioRow as any;

const themeOptions: { key: string; label: string; description: string }[] = [
  {
    key: "soft",
    label: "Soft blue (default)",
    description: "Gentle pastel border that fits Discord’s dark theme.",
  },
  {
    key: "vibrant",
    label: "Vibrant",
    description: "Bright accent border to make code really pop.",
  },
  {
    key: "mono",
    label: "Monokai-ish",
    description: "Muted, code-editor style border colors.",
  },
];

export default function Settings() {
  useProxy(storage);

  const footerText =
    typeof storage.footer_text === "string" && storage.footer_text.trim().length
      ? storage.footer_text
      : "BetterCode";

  const themeKey =
    typeof storage.embed_theme === "string" && storage.embed_theme.length > 0
      ? storage.embed_theme
      : "soft";

  return (
    <ScrollView style={{ flex: 1 }}>
      <FormSection title="BetterCode">
        <FormRow
          label="BetterCode"
          subLabel="Beautiful, configurable codeblock embeds"
          leading={
            <FormIcon
              source={{
                uri: "https://avatars.githubusercontent.com/u/567969902",
              }}
            />
          }
        />
        <FormRow
          label="by UncleTyrone"
          subLabel="Self‑hosted, Prism‑powered syntax highlighting"
        />
      </FormSection>

      <FormSection title="Display">
        <FormSwitchRow
          label="Show line numbers"
          subLabel="Prefix each code line with its line number"
          value={storage.show_line_num ?? false}
          onValueChange={(v: boolean) => {
            storage.show_line_num = v;
          }}
        />
        <FormSwitchRow
          label="Show footer label"
          subLabel="Tiny signature label under every code embed"
          value={storage.show_footer !== false}
          onValueChange={(v: boolean) => {
            storage.show_footer = v;
          }}
        />
        <FormRow
          label="Footer text"
          subLabel="Used when footer label is enabled"
        />
        <FormInput
          title=""
          placeholder="e.g. BetterCode, UncleTyrone, etc."
          value={footerText}
          onChange={(t: string) => {
            storage.footer_text = t;
          }}
          style={{ marginTop: -8, marginHorizontal: 12 }}
        />
      </FormSection>

      <FormSection title="Embed theme">
        {themeOptions.map((opt) => (
          <FormRadioRow
            key={opt.key}
            label={opt.label}
            subLabel={opt.description}
            selected={themeKey === opt.key}
            onPress={() => {
              storage.embed_theme = opt.key;
            }}
          />
        ))}
      </FormSection>

      <FormSection title="Behavior">
        <FormSwitchRow
          label="Tighten gap under codeblocks"
          subLabel="Removes extra blank space between text and code embeds"
          value={storage.gap_fix !== false}
          onValueChange={(v: boolean) => {
            storage.gap_fix = v;
          }}
        />
      </FormSection>

      <FormSection title="Information">
        <FormRow
          label="Source on GitHub"
          subLabel="View the plugin source and website"
          leading={<FormIcon source={getAssetIDByName("img_account_sync_github_white")} />}
          trailing={FormRow.Arrow}
          onPress={() => Linking.openURL("https://github.com/UncleTyrone/uncletyrone.github.io")}
        />
      </FormSection>
    </ScrollView>
  );
}
