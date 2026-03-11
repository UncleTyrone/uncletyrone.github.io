import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";
import { Forms, General } from "@vendetta/ui/components";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { Linking } from "@vendetta/metro/common";

const { ScrollView } = General;
const { FormSection, FormSwitchRow, FormRow, FormIcon } = Forms;

export default function Settings() {
  useProxy(storage);

  return (
    <ScrollView style={{ flex: 1 }}>
      <FormSection title="HighlightCode">
        <FormRow
          label="HighlightCode"
          subLabel="by mafu"
          leading={
            <FormIcon
              source={{
                uri: "https://avatars.githubusercontent.com/u/43488869",
              }}
            />
          }
        />
      </FormSection>
      <FormSection title="Settings">
        <FormSwitchRow
          label="Show line numbers"
          subLabel="Prepend line numbers to code blocks"
          value={storage.show_line_num ?? false}
          onValueChange={(v: boolean) => {
            storage.show_line_num = v;
          }}
        />
      </FormSection>
      <FormSection title="Information">
        <FormRow
          label="Source on GitHub"
          leading={<FormIcon source={getAssetIDByName("img_account_sync_github_white")} />}
          trailing={FormRow.Arrow}
          onPress={() => Linking.openURL("https://github.com/m4fn3/HighlightCode")}
        />
      </FormSection>
    </ScrollView>
  );
}
