/**
 * @name UserTags
 * @version 0.0.1
 * @description Adds custom tags next to usernames in Discord.
 * @author JimMcBubbles
 * @authorId jimmcbubbles
 * @source https://github.com/JimMcBubbles/UserTags
 * @updateUrl https://raw.githubusercontent.com/JimMcBubbles/UserTags/main/UserTags.plugin.js
 */

module.exports = class UserTags {
    constructor() {
        this.pluginName = "UserTags";
        this.pluginVersion = "0.0.1";
        this.pluginAuthor = "JimMcBubbles";

        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);
    }

    // Called when the plugin is enabled
    start() {
        BdApi.log(this.pluginName, "started");
        // We'll hook into Discord here later to add tags.
    }

    // Called when the plugin is disabled
    stop() {
        BdApi.log(this.pluginName, "stopped");
        // Clean up any patches / listeners here later.
    }

    // Shown in BetterDiscord's plugin list
    getName() {
        return this.pluginName;
    }

    getDescription() {
        return "Adds custom tags next to usernames in Discord.";
    }

    getVersion() {
        return this.pluginVersion;
    }

    getAuthor() {
        return this.pluginAuthor;
    }

    // Optional: settings panel stub (we'll fill this out later)
    getSettingsPanel() {
        const panel = document.createElement("div");
        panel.style.padding = "10px";
        panel.innerText = "UserTags settings will go here.";
        return panel;
    }
};
