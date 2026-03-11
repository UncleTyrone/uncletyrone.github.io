import {FormRow, FormSection, View, ScrollView, Image, Text, FormSwitch, FormInput, FormLabel, FormText} from 'enmity/components'
import {Constants, Dialog, Navigation, React, StyleSheet, Toasts} from 'enmity/metro/common'
import {Linking} from "enmity/metro/common"
// @ts-ignore
import {name, version} from '../../manifest.json'
import {getIDByName} from "enmity/api/assets"
import {getByProps} from "enmity/modules"

const GitHubIcon = getIDByName('img_account_sync_github_white')
const DiscordIcon = getIDByName('Discord')
const TwitterIcon = getIDByName('img_account_sync_twitter_white')
const FailIcon = getIDByName('Small')

const Invites = getByProps('acceptInviteAndTransitionToInviteChannel')
const K2genmityURL = "https://github.com/m4fn3/K2genmity/blob/master/README.md#installation"

function k2genmity() {
    Dialog.show({
        title: "HighlightCode",
        body: "K2genmity v2.0.0 or later is required to use this feature",
        confirmText: "Check install instructions",
        cancelText: "Later",
        onConfirm: () => {
            Linking.openURL(K2genmityURL)
        }
    })
}

export default ({settings}) => {
    const styles = StyleSheet.createThemedStyleSheet({
        container: {
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center"
        },
        image: {
            width: 70,
            height: 70,
            marginTop: 20,
            marginLeft: 20
        },
        title: {
            flexDirection: "column",
        },
        name: {
            fontSize: 30,
            paddingTop: 20,
            paddingLeft: 20,
            paddingRight: 30,
            color: Constants.ThemeColorMap.HEADER_PRIMARY,
        },
        author: {
            fontSize: 15,
            paddingLeft: 50,
            color: Constants.ThemeColorMap.HEADER_SECONDARY,
        },
        info: {
            height: 45,
            paddingTop: 3,
            paddingBottom: 3,
            justifyContent: "center",
            alignItems: "center"
        },
        footer: {
            color: Constants.ThemeColorMap.HEADER_SECONDARY,
            textAlign: 'center',
            paddingTop: 10,
            paddingBottom: 20
        }
    })
    return (
        <ScrollView>
            <View style={styles.container}>
                <Image
                    source={{uri: 'https://avatars.githubusercontent.com/u/43488869'}}
                    style={styles.image}
                />
                <View style={styles.title}>
                    <Text style={styles.name}>HighlightCode</Text>
                    <Text style={styles.author}>by mafu</Text>
                </View>
            </View>
            <FormSection title="SETTINGS">
                <FormRow
                    label="Show line numbers"
                    trailing={
                        <FormSwitch
                            value={settings.getBoolean("show_line_num", false)}
                            onValueChange={(value) => {
                                settings.set("show_line_num", value)
                            }}
                        />
                    }
                />
            </FormSection>
            <FormSection title="SETTINGS (K2genmity required)">
                <FormRow
                    label="Change the font to monospace"
                    trailing={
                        <FormSwitch
                            value={settings.getBoolean("change_font", false)}
                            onValueChange={(value) => {
                                if (settings.get("_isK2genmity")) {
                                    settings.set("change_font", value)
                                } else {
                                    value = false
                                    k2genmity()
                                }
                            }}
                        />
                    }
                />
                <FormInput
                    title="Font size of monospace"
                    value={settings.get("font_size", 10).toString()}
                    onSubmitEditing={(event) => {
                        if (settings.get("_isK2genmity")) {
                            if (isNaN(event.nativeEvent.text)) {
                                Toasts.open({
                                    content: `You entered an invalid number`,
                                    source: FailIcon
                                })
                            } else {
                                settings.set("font_size", Number(event.nativeEvent.text))
                            }
                        } else {
                            k2genmity()
                        }
                    }}
                />
            </FormSection>
            <FormSection title="INFORMATION">
                <FormRow
                    label="Follow me on Twitter"
                    style={styles.info}
                    trailing={FormRow.Arrow}
                    leading={<FormRow.Icon source={TwitterIcon}/>}
                    onPress={() => {
                        Linking.openURL("https://twitter.com/m4fn3")
                    }}
                />
                <FormRow
                    label="Visit my server for help"
                    style={styles.info}
                    trailing={FormRow.Arrow}
                    leading={<FormRow.Icon source={DiscordIcon}/>}
                    onPress={() => {
                        Invites.acceptInviteAndTransitionToInviteChannel({
                            inviteKey: 'TrCqPTCrdq',
                            context: {location: 'Invite Button Embed'},
                            callback: () => {
                                Navigation.pop()
                            }
                        })
                    }}
                    onLongPress={() => settings.set("_tester", !settings.get("_tester"))}
                />
                <FormRow
                    label="Check Source on GitHub"
                    style={styles.info}
                    trailing={FormRow.Arrow}
                    leading={<FormRow.Icon source={GitHubIcon}/>}
                    onPress={() => {
                        Linking.openURL("https://github.com/m4fn3/Test")
                    }}
                />
            </FormSection>
            <Text style={styles.footer}>
                {`v${version}`}
            </Text>
        </ScrollView>
    )
};