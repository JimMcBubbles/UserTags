/**
 * @name UserTags
 * @version 1.10.3
 * @description add user localized customizable tags to other users using a searchable table/grid or per user context menu.
 * @author Nyx
 * @authorId 270848136006729728
 * @author JimMcBubbles
 * @authorId 381157302369255424
 * @source https://github.com/JimMcBubbles/UserTags
 * @updateUrl https://raw.githubusercontent.com/JimMcBubbles/UserTags/main/UserTags.plugin.js
 */

const config = {
    info: {
        name: "UserTags",
        authors: [
            {
                name: "Nyx",
                discord_id: "270848136006729728"
            },
            {
                name: "JimMcBubbles",
                discord_id: "381157302369255424"
            }
        ],
        version: "1.10.3",
        description: "Add user-localized customizable tags to other users using a searchable table or context menu."
    },
    github: "https://github.com/SrS2225a/BetterDiscord/blob/master/plugins/UserTags/UserTags.plugin.js",
    github_raw: "https://raw.githubusercontent.com/SrS2225a/BetterDiscord/master/plugins/UserTags/UserTags.plugin.js",
    changelog: [
        {
            title: "1.10.3",
            items: [
                "Fixed toolbar button modal to reuse the existing UserTags overview and resolved React 301 errors when opening it."
            ]
        },
        { 
            title: "1.10.2",
            items: [
                "Fixed a runtime error from UI.openModal and restored the correctly scaled overview modal for the toolbar button."
            ]
        },
        {
            title: "1.10.1",
            items: [
                "Fixed the UserTags Overview modal scaling when opened from the toolbar button.",
                "Ensured both entry points share the same overview modal layout and viewport-based sizing."
            ]
        },
        {
            title: "1.10.0",
            items: [
                "Added a UserTags Settings button to the channel header toolbar.",
                "Made the UserTags overview accessible directly from any channel."
            ]
        },
        {
            title: "1.9.1",
            items: [
                "Fixed the UserTags toolbar button so it appears in the channel header.",
                "Toolbar button now opens the UserTags Settings overview from any channel."
            ]
        },
        {
            title: "1.9.0",
            items: [
                "Added a toolbar button in the channel header to open UserTags Settings.",
                "Made the UserTags overview accessible directly from any channel."
            ]
        },
        {
            title: "1.8.11",
            items: [
                "Scaled the UserTags Settings modal to use more of the Discord window.",
                "Adjusted overview grid height to better fit available vertical space."
            ]
        },
        {
            title: "1.8.10",
            items: [
                "Updated plugin metadata to match the current tag filtering and overview experience.",
                "Clarified the description to highlight tag management workflows."
            ]
        },
        {
            title: "Improvements",
            items: [
                "Store usernames alongside tags in the JSON.",
                "Maintain a tag-indexed JSON (TagIndex) that groups users by tag.",
                "Show a dropdown of existing tags when adding/editing tags, with autocomplete-style filtering.",
                "Add a settings panel grid showing all friends (plus any tagged non-friends) vs all tags.",
                "Make the grid cells clickable to toggle tags on/off for each user.",
                "Make all columns (including the User column) resizable by dragging the header edge.",
                "In the grid, show avatar + display name; on hover show username (userId); on click open the user profile.",
                "Switch settings view to CSS grid so the User column can be resized smaller than the longest name (names are truncated with ellipsis).",
                "Make column headers use a solid background so they’re no longer transparent when scrolling.",
                "Add an \"Add Tag\" button in the overview to create new global tags.",
                "Add a regex filter field to the overview to filter visible users.",
                "Add right-click context menus to tag headers for rename, filter, duplicate and delete.",
                "Allow regex filter to search mutual server names.",
                "Add @name and $server prefixes in the overview filter.",
                "Allow multiple tag filters (require / hide) at once.",
                "Shrink default tag column width in the overview grid so more tags fit without scrolling.",
                "Highlight the hovered row and column in the overview grid.",
                "Keep header backgrounds solid when highlighting columns (no more transparent-looking headers).",
                "Keep the left User column solid when highlighting rows.",
                "Show count and percentage for each tag column on header hover.",
                "Order tag columns by count (descending) by default, based on currently visible users.",
                "Show total tag assignments in the overview summary."
            ]
        }
    ],
    main: "index.js"
};

const { Data, UI, Webpack, React, DOM } = BdApi;
const WebpackModules = BdApi?.WebpackModules ?? BdApi?.Webpack ?? Webpack;

if (!WebpackModules.findByProps && Webpack?.getModule) {
    WebpackModules.findByProps = (...props) => Webpack.getModule(
        module => props.every(prop => module?.[prop] !== undefined),
        { searchExports: true }
    );
}

const StoreModules = {
    UserStore: Webpack.getStore("UserStore"),
    RelationshipStore: Webpack.getStore("RelationshipStore"),
    GuildStore: Webpack.getStore("GuildStore"),
    GuildMemberStore: Webpack.getStore("GuildMemberStore")
};

// Module to open the user profile modal from settings grid
const UserProfileActions = Webpack.getModule(
    m => m && typeof m.openUserProfileModal === "function",
    { searchExports: true }
);

const Button = Webpack.getModule(
    m => m?.Colors && m?.Looks && m?.Sizes,
    { searchExports: true }
);

const IconWrapperClasses = BdApi.Webpack.getByKeys("iconWrapper", "clickable");
const IconClasses = BdApi.Webpack.getByKeys("browser", "icon");
const [ChannelHeader, ChannelHeaderKey] = BdApi.Webpack.getWithKey(BdApi.Webpack.Filters.byKeys("Icon", "Divider"));

function ToolbarComponent({ onClick }) {
    const Tooltip = BdApi.Components?.Tooltip;
    const label = "UserTags Settings";
    const className = `${IconClasses?.icon ?? ""} ${IconWrapperClasses?.iconWrapper ?? ""} ${IconWrapperClasses?.clickable ?? ""}`.trim();

    const button = BdApi.React.createElement(
        "div",
        {
            className,
            onClick,
            role: "button",
            "aria-label": label,
            "data-usetags-toolbar-button": true
        },
        BdApi.React.createElement(
            "svg",
            {
                className: IconWrapperClasses?.icon,
                "aria-hidden": "true",
                role: "img",
                width: "24",
                height: "24",
                fill: "none",
                viewBox: "0 0 24 24"
            },
            BdApi.React.createElement("path", {
                fill: "currentColor",
                d: "M20.59 13.41 11 3.83C10.63 3.45 10.14 3.26 9.64 3.26H4c-.55 0-1 .45-1 1v5.66c0 .5.19.99.57 1.36l9.59 9.59c.78.78 2.05.78 2.83 0l4.6-4.6c.78-.78.78-2.05 0-2.83ZM7 8.5C6.17 8.5 5.5 7.83 5.5 7S6.17 5.5 7 5.5 8.5 6.17 8.5 7 7.83 8.5 7 8.5Z"
            })
        )
    );

    if (Tooltip) {
        return BdApi.React.createElement(
            Tooltip,
            { text: label },
            ({ onMouseEnter, onMouseLeave }) =>
                BdApi.React.cloneElement(button, {
                    onMouseEnter,
                    onMouseLeave
                })
        );
    }

    return button;
}

// Column key for the user column (used for width state)
const USER_COL_KEY = "__USER__";

function UserTagsOverview({ plugin }) {
    // Default width for User column so it doesn't start at 0
    const [colWidths, setColWidths] = React.useState({ [USER_COL_KEY]: 220 });
    const [version, setVersion] = React.useState(0); // eslint-disable-line no-unused-vars
    const [filter, setFilter] = React.useState("");
    const [includeTags, setIncludeTags] = React.useState([]);
    const [excludeTags, setExcludeTags] = React.useState([]);
    const [hoverUserId, setHoverUserId] = React.useState(null);
    const [hoverTag, setHoverTag] = React.useState(null);

    const data = Data.load(plugin._config.info.name, "UserData") || {};
    const idSet = new Set();

    // Friend IDs from RelationshipStore
    try {
        const rel = StoreModules.RelationshipStore;
        if (rel) {
            if (typeof rel.getFriendIDs === "function") {
                rel.getFriendIDs().forEach(id => idSet.add(id));
            } else if (typeof rel.getRelationships === "function") {
                const rels = rel.getRelationships();
                for (const id in rels) {
                    // 1 = Friend in Discord's RelationshipType enum
                    if (rels[id] === 1) idSet.add(id);
                }
            }
        }
    } catch (e) {
        console.warn("[UserTags] Failed to read friends from RelationshipStore", e);
    }

    // Also include any users that already have tags
    Object.keys(data).forEach(id => idSet.add(id));

    const userIds = Array.from(idSet);

    const users = userIds.map(userId => {
        const entry = plugin.getOrInitUserEntry(data, userId);
        const userObj = StoreModules.UserStore.getUser(userId);

        const username = userObj?.username || entry.username || userId;
        // "screenname or nickname": prefer global display name if present
        const displayName = userObj?.globalName || userObj?.username || entry.username || userId;

        let avatarUrl = null;
        if (userObj) {
            if (typeof userObj.getAvatarURL === "function") {
                avatarUrl = userObj.getAvatarURL(false, 32);
            } else if (userObj.avatarURL) {
                avatarUrl = userObj.avatarURL;
            } else if (userObj.avatar) {
                avatarUrl = `https://cdn.discordapp.com/avatars/${userId}/${userObj.avatar}.webp?size=32`;
            }
        }

        // Mutual servers -> names (from GuildStore + GuildMemberStore)
        let mutualGuildNames = [];
        try {
            const guildStore = StoreModules.GuildStore;
            const memberStore = StoreModules.GuildMemberStore;
            if (
                guildStore &&
                memberStore &&
                typeof guildStore.getGuilds === "function"
            ) {
                const rawGuilds = guildStore.getGuilds();
                let guildList = [];

                if (rawGuilds) {
                    if (Array.isArray(rawGuilds)) {
                        guildList = rawGuilds;
                    } else if (typeof rawGuilds.values === "function") {
                        guildList = Array.from(rawGuilds.values());
                    } else {
                        guildList = Object.values(rawGuilds);
                    }
                }

                mutualGuildNames = guildList
                    .filter(g => {
                        const members = memberStore.getMembers?.(g.id);
                        if (members && members[userId]) return true;
                        if (typeof memberStore.isMember === "function") {
                            return memberStore.isMember(g.id, userId);
                        }
                        return false;
                    })
                    .map(g => g.name);
            }
        } catch (e) {
            // ignore mutual guild errors
        }

        return {
            userId,
            username,
            displayName,
            avatarUrl,
            mutualGuildNames,
            tags: Array.isArray(entry.tags) ? entry.tags : []
        };
    });

    const allTags = Array.from(
        new Set(
            users.flatMap(u => u.tags)
        )
    ).sort((a, b) => a.localeCompare(b));

    // Build include/exclude arrays from filter input
    React.useEffect(() => {
        const raw = filter.trim();
        const include = [];
        const exclude = [];

        if (!raw) {
            setIncludeTags([]);
            setExcludeTags([]);
            return;
        }

        const tokens = raw.split(/\s+/).filter(Boolean);
        tokens.forEach(t => {
            if (t.startsWith("-")) exclude.push(t.substring(1));
            else include.push(t);
        });

        setIncludeTags(include);
        setExcludeTags(exclude);
    }, [filter]);

    // Tag ordering: default by count (descending) based on visible users
    const tagCountMap = {};
    const matchesTag = (tagList, term) => tagList.some(t => t.toLowerCase().includes(term.toLowerCase()));

    // Filter logic
    const [regexError, setRegexError] = React.useState(false);
    let serverTerm = null;
    let nameTerm = null;

    let regex = null;
    let filterTerm = filter.trim();
    if (filterTerm.startsWith("$")) {
        serverTerm = filterTerm.substring(1).trim();
    } else if (filterTerm.startsWith("@")) {
        nameTerm = filterTerm.substring(1).trim();
    } else if (filterTerm) {
        try {
            regex = new RegExp(filterTerm, "i");
            setRegexError(false);
        } catch (e) {
            setRegexError(true);
        }
    } else {
        setRegexError(false);
    }

    const visibleUsers = users.filter(user => {
        const includeOk = includeTags.every(tag => matchesTag(user.tags, tag));
        const excludeOk = excludeTags.every(tag => !matchesTag(user.tags, tag));
        if (!includeOk || !excludeOk) return false;

        if (serverTerm) {
            return user.mutualGuildNames.some(name => name.toLowerCase().includes(serverTerm.toLowerCase()));
        }

        if (nameTerm) {
            return user.displayName.toLowerCase().includes(nameTerm.toLowerCase());
        }

        if (regex) {
            return regex.test(user.displayName) || regex.test(user.username) || user.tags.some(tag => regex.test(tag));
        }

        return true;
    });

    visibleUsers.forEach(user => {
        user.tags.forEach(tag => {
            tagCountMap[tag] = (tagCountMap[tag] || 0) + 1;
        });
    });

    const sortedTags = allTags.sort((a, b) => {
        const countDiff = (tagCountMap[b] || 0) - (tagCountMap[a] || 0);
        if (countDiff !== 0) return countDiff;
        return a.localeCompare(b);
    });

    // Total assignments for summary
    let totalAssignments = 0;
    users.forEach(u => { totalAssignments += u.tags.length; });
    const visibleAssignments = visibleUsers.reduce((sum, u) => sum + u.tags.length, 0);

    const handleAddTagClick = () => {
        const tag = prompt("Enter new tag name (alphanumeric and underscore only):");
        if (!tag) return;

        const sanitized = tag.replace(/[^a-zA-Z0-9_]/g, "");
        if (!sanitized) return;

        // Add this tag to TagIndex if not present
        const tagIndex = Data.load(plugin._config.info.name, "TagIndex") || {};
        if (!tagIndex[sanitized]) {
            tagIndex[sanitized] = [];
            Data.save(plugin._config.info.name, "TagIndex", tagIndex);
        }

        // Force re-render by bumping version
        setVersion(v => v + 1);
    };

    const startResize = (event, colKey) => {
        const headerEl = event.target.closest(".usertags-grid-header");
        if (!headerEl) return;

        const startX = event.clientX;
        const startWidth = headerEl.offsetWidth;

        const onMove = (e) => {
            const delta = e.clientX - startX;
            const newWidth = Math.max(40, startWidth + delta);
            setColWidths(prev => ({ ...prev, [colKey]: newWidth }));
        };

        const onUp = () => {
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
        };

        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
    };

    const handleToggle = (userId, tag) => {
        const data = Data.load(plugin._config.info.name, "UserData") || {};
        const entry = plugin.getOrInitUserEntry(data, userId);

        const idx = entry.tags.indexOf(tag);
        if (idx === -1) entry.tags.push(tag);
        else entry.tags.splice(idx, 1);

        // Save username for display purposes
        const userObj = StoreModules.UserStore.getUser(userId);
        entry.username = userObj?.username || entry.username || userId;

        plugin.saveUserData(data);
        setVersion(v => v + 1);
    };

    const openTagContextMenu = (event, tag) => {
        const items = [
            {
                label: "Require only this tag",
                action: () => setFilter(tag)
            },
            {
                label: "Hide this tag",
                action: () => setFilter("-" + tag)
            },
            {
                label: "Rename",
                action: () => plugin.renameTag(tag, () => setVersion(v => v + 1))
            },
            {
                label: "Duplicate",
                action: () => plugin.duplicateTag(tag, () => setVersion(v => v + 1))
            },
            {
                label: "Delete",
                danger: true,
                action: () => plugin.deleteTag(tag, () => setVersion(v => v + 1))
            }
        ];

        const menu = BdApi.ContextMenu.buildMenu(items);
        BdApi.ContextMenu.open(event, menu);
    };

    if (userIds.length === 0 || sortedTags.length === 0) {
        return React.createElement("div", { className: "usertags-settings" },
            React.createElement("h2", null, "UserTags Overview"),
            React.createElement("p", null, "No tags or users to display yet. Add tags to users by opening their profile and using the Tags section, or create a new tag here."),
            React.createElement(
                "div",
                { className: "usertags-toolbar" },
                React.createElement(
                    "div",
                    { className: "usertags-toolbar-left" },
                    React.createElement("div", { className: "usertags-count" }, "Users: 0 · Tags: 0 · Tag assignments: 0/0")
                ),
                React.createElement(
                    "button",
                    { className: "usertags-addtag-btn", onClick: handleAddTagClick },
                    "Add Tag"
                )
            )
        );
    }

    // Build grid template columns based on current widths
    const columnWidths = [
        colWidths[USER_COL_KEY] || 220,
        // default tag width: 40px
        ...sortedTags.map(tag => colWidths[tag] || 40)
    ];
    const gridTemplateColumns = columnWidths.map(w => `${w}px`).join(" ");

    const gridChildren = [];

    // Header row: User column
    gridChildren.push(
        React.createElement(
            "div",
            {
                key: "header-user",
                className: "usertags-grid-header usertags-grid-header-user"
            },
            React.createElement(
                "div",
                { className: "usertags-header-cell" },
                React.createElement("span", { className: "usertags-header-label" }, "User"),
                React.createElement("span", {
                    className: "usertags-col-resizer",
                    onMouseDown: (e) => startResize(e, USER_COL_KEY)
                })
            )
        )
    );

    // Header row: Tag columns
    sortedTags.forEach(tag => {
        const headerClass =
            "usertags-grid-header" +
            (hoverTag === tag ? " usertags-col-hover-header" : "");
        const count = tagCountMap[tag] || 0;
        const percent = visibleUsers.length
            ? (count * 100) / visibleUsers.length
            : 0;
        const headerTitle = `${tag} — ${count} (${percent.toFixed(1)}%)`;

        gridChildren.push(
            React.createElement(
                "div",
                {
                    key: `header-${tag}`,
                    className: headerClass,
                    title: headerTitle,
                    onContextMenu: (e) => openTagContextMenu(e, tag),
                    onMouseEnter: () => setHoverTag(tag),
                    onMouseLeave: () =>
                        setHoverTag(prev => (prev === tag ? null : prev))
                },
                React.createElement(
                    "div",
                    { className: "usertags-header-cell" },
                    React.createElement("span", { className: "usertags-header-label" }, tag),
                    React.createElement("span", {
                        className: "usertags-col-resizer",
                        onMouseDown: (e) => startResize(e, tag)
                    })
                )
            )
        );
    });

    // Body rows
    visibleUsers.forEach(user => {
        // User cell
        const userCellClass =
            "usertags-usercell" +
            (hoverUserId === user.userId ? " usertags-row-hover" : "");
        gridChildren.push(
            React.createElement(
                "div",
                {
                    key: `row-${user.userId}-user`,
                    className: userCellClass,
                    onMouseEnter: () => setHoverUserId(user.userId),
                    onMouseLeave: () =>
                        setHoverUserId(prev => (prev === user.userId ? null : prev))
                },
                React.createElement(
                    "div",
                    {
                        className: "usertags-userinfo",
                        title: `${user.username} (${user.userId})`,
                        onClick: () => {
                            if (UserProfileActions && typeof UserProfileActions.openUserProfileModal === "function") {
                                UserProfileActions.openUserProfileModal({ userId: user.userId });
                            }
                        }
                    },
                    user.avatarUrl
                        ? React.createElement("img", {
                              className: "usertags-avatar",
                              src: user.avatarUrl
                          })
                        : null,
                    React.createElement("span", { className: "usertags-username" }, user.displayName)
                )
            )
        );

        // Tag cells
        sortedTags.forEach(tag => {
            const has = user.tags.includes(tag);
            let cellClass = has ? "usertags-cell has-tag" : "usertags-cell";
            if (hoverUserId === user.userId) cellClass += " usertags-row-hover";
            if (hoverTag === tag) cellClass += " usertags-col-hover";

            gridChildren.push(
                React.createElement(
                    "div",
                    {
                        key: `row-${user.userId}-tag-${tag}`,
                        className: cellClass,
                        onMouseEnter: () => {
                            setHoverUserId(user.userId);
                            setHoverTag(tag);
                        },
                        onMouseLeave: () => {
                            setHoverUserId(prev => (prev === user.userId ? null : prev));
                            setHoverTag(prev => (prev === tag ? null : prev));
                        },
                        onClick: () => handleToggle(user.userId, tag)
                    },
                    has ? "✓" : ""
                )
            );
        });
    });

    const parts = [];
    if (includeTags.length > 0) parts.push(`Require: ${includeTags.join(", ")}`);
    if (excludeTags.length > 0) parts.push(`Exclude: ${excludeTags.join(", ")}`);
    const tagFilterLabel = parts.length ? parts.join(" · ") : null;

    const summaryText =
        filter && regexError
            ? `Users: ${visibleUsers.length}/${users.length} · Tags: ${sortedTags.length} · Tag assignments: ${visibleAssignments}/${totalAssignments}`
            : `Users: ${visibleUsers.length}/${users.length} · Tags: ${sortedTags.length} · Tag assignments: ${visibleAssignments}/${totalAssignments}`;

    return React.createElement(
        "div",
        { className: "usertags-settings" },
        React.createElement("h2", null, "UserTags Overview"),
        React.createElement(
            "p",
            null,
            "Grid view of all friends (plus any tagged non-friends) and which tags they have. ",
            "Click a cell to toggle a tag for that user. Drag any header edge to resize its column. ",
            "Right-click a tag header for more options (require/hide/rename/duplicate/delete). Click a user to open their profile. ",
            "Use the filter box for regex search, @Name for name-only, or $Server for mutual-server-only search ",
            "(use \\@ / \\$ at the start if you want a literal regex beginning with those symbols)."
        ),
        React.createElement(
            "div",
            { className: "usertags-toolbar" },
            React.createElement(
                "div",
                { className: "usertags-toolbar-left" },
                React.createElement("div", { className: "usertags-count" }, summaryText),
                React.createElement("input", {
                    className: "usertags-filter-input" + (regexError ? " usertags-filter-input-error" : ""),
                    placeholder: "Filter: regex, @name, or $server",
                    value: filter,
                    onChange: (e) => setFilter(e.target.value)
                }),
                regexError
                    ? React.createElement("div", { className: "usertags-filter-error" }, "Invalid regex")
                    : tagFilterLabel
                        ? React.createElement("div", { className: "usertags-tagfilter-pill" }, tagFilterLabel)
                        : serverTerm
                            ? React.createElement("div", { className: "usertags-tagfilter-pill" }, `Server search: "${filter.trim().slice(1).trim()}"`)
                            : nameTerm
                                ? React.createElement("div", { className: "usertags-tagfilter-pill" }, `Name search: "${filter.trim().slice(1).trim()}"`)
                                : null
            ),
            React.createElement(
                "button",
                { className: "usertags-addtag-btn", onClick: handleAddTagClick },
                "Add Tag"
            )
        ),
        React.createElement(
            "div",
            { className: "usertags-grid" },
            React.createElement(
                "div",
                { className: "usertags-grid-inner", style: { gridTemplateColumns } },
                gridChildren
            )
        )
    );
}

class UserTags {
    constructor() {
        this._config = config;
        this.settings = Data.load(this._config.info.name, "settings") || {};
        this.userPopoutPatched = false;
    }

    getName() { return this._config.info.name; }
    getAuthor() { return this._config.info.authors.map(a => a.name).join(", "); }
    getVersion() { return this._config.info.version; }
    getDescription() { return this._config.info.description; }

    /**
     * Ensures that data[userId] is in the new format:
     * {
     *   username: string | null,
     *   tags: string[]
     * }
     *
     * Also upgrades legacy array format automatically.
     */
    getOrInitUserEntry(data, userId) {
        let entry = data[userId];

        // Legacy format: array of tags
        if (Array.isArray(entry)) {
            const user = StoreModules.UserStore.getUser(userId);
            entry = {
                username: user ? user.username : null,
                tags: entry
            };
            data[userId] = entry;
        } else if (!entry || typeof entry !== "object") {
            // No entry yet or unexpected type
            const user = StoreModules.UserStore.getUser(userId);
            entry = {
                username: user ? user.username : null,
                tags: []
            };
            data[userId] = entry;
        } else {
            // New format, but make sure fields are sensible
            if (!Array.isArray(entry.tags)) {
                entry.tags = [];
            }
            if (!entry.username) {
                const user = StoreModules.UserStore.getUser(userId);
                if (user) entry.username = user.username;
            }
        }

        return entry;
    }

    /**
     * Build a tag-indexed map:
     * {
     *   [tagName]: [
     *      { userId, username }
     *   ]
     * }
     */
    buildTagIndex(data) {
        const tagIndex = {};
        for (const userId in data) {
            const entry = this.getOrInitUserEntry(data, userId);
            const username =
                entry.username ||
                (StoreModules.UserStore.getUser(userId)?.username ?? null);

            if (!Array.isArray(entry.tags)) continue;

            entry.tags.forEach(tag => {
                if (!tag || !tag.trim()) return;
                if (!tagIndex[tag]) tagIndex[tag] = [];
                tagIndex[tag].push({ userId, username });
            });
        }
        return tagIndex;
    }

    /**
     * Centralized save for user data:
     * - Saves per-user data (UserData)
     * - Saves tag-indexed data (TagIndex)
     */
    saveUserData(data) {
        Data.save(this._config.info.name, "UserData", data);
        const tagIndex = this.buildTagIndex(data);
        Data.save(this._config.info.name, "TagIndex", tagIndex);
    }

    /**
     * Add a global tag (used so tags can exist even before any user has them).
     */
    addGlobalTag(tagName) {
        const raw = (tagName || "").trim();
        if (!raw) return;
        const safe = raw.replace(/[^a-zA-Z0-9_]/g, "");
        if (!safe) return;

        const globalTags = Data.load(this._config.info.name, "GlobalTags") || [];
        if (!globalTags.includes(safe)) {
            globalTags.push(safe);
            Data.save(this._config.info.name, "GlobalTags", globalTags);
        }
    }

    /**
     * Rename a tag across all users and global tags.
     */
    renameTag(oldTag, newTag) {
        if (!oldTag || !newTag || oldTag === newTag) return;
        const data = Data.load(this._config.info.name, "UserData") || {};
        for (const userId in data) {
            const entry = this.getOrInitUserEntry(data, userId);
            if (!Array.isArray(entry.tags)) entry.tags = [];
            const idx = entry.tags.indexOf(oldTag);
            if (idx !== -1) {
                // Avoid duplicates
                if (!entry.tags.includes(newTag)) entry.tags[idx] = newTag;
                else entry.tags.splice(idx, 1);
            }
        }

        let globalTags = Data.load(this._config.info.name, "GlobalTags") || [];
        globalTags = globalTags.filter(t => t !== oldTag);
        if (!globalTags.includes(newTag)) globalTags.push(newTag);
        Data.save(this._config.info.name, "GlobalTags", globalTags);

        this.saveUserData(data);
    }

    /**
     * Delete a tag across all users and from global tags.
     */
    deleteTag(tag) {
        if (!tag) return;
        const data = Data.load(this._config.info.name, "UserData") || {};
        for (const userId in data) {
            const entry = this.getOrInitUserEntry(data, userId);
            if (!Array.isArray(entry.tags)) entry.tags = [];
            const before = entry.tags.length;
            entry.tags = entry.tags.filter(t => t !== tag);
            if (entry.tags.length === 0 && before > 0) {
                delete data[userId];
            } else {
                data[userId] = entry;
            }
        }

        let globalTags = Data.load(this._config.info.name, "GlobalTags") || [];
        globalTags = globalTags.filter(t => t !== tag);
        Data.save(this._config.info.name, "GlobalTags", globalTags);

        this.saveUserData(data);
    }

    /**
     * Duplicate a tag to a new tag name across all users.
     */
    duplicateTag(tag) {
        if (!tag) return;
        const allTags = this.getAllTags();
        let base = tag + "_copy";
        let candidate = base;
        let counter = 2;
        while (allTags.includes(candidate)) {
            candidate = base + "_" + counter;
            counter++;
        }

        const data = Data.load(this._config.info.name, "UserData") || {};
        for (const userId in data) {
            const entry = this.getOrInitUserEntry(data, userId);
            if (!Array.isArray(entry.tags)) entry.tags = [];
            if (entry.tags.includes(tag) && !entry.tags.includes(candidate)) {
                entry.tags.push(candidate);
            }
        }

        this.addGlobalTag(candidate);
        this.saveUserData(data);
    }

    /**
     * Returns a sorted array of ALL tags used anywhere.
     * Uses TagIndex if present; falls back to scanning UserData.
     * Also merges in any GlobalTags created from the overview.
     */
    getAllTags() {
        const tagIndex = Data.load(this._config.info.name, "TagIndex") || null;
        const globalTags = Data.load(this._config.info.name, "GlobalTags") || [];
        const tagsSet = new Set();

        if (tagIndex) {
            for (const tagName in tagIndex) {
                if (tagName && tagName.trim()) tagsSet.add(tagName);
            }
        } else {
            const userData = Data.load(this._config.info.name, "UserData") || {};
            for (const userId in userData) {
                const entry = userData[userId];
                let tags = [];
                if (Array.isArray(entry)) tags = entry;
                else if (entry && Array.isArray(entry.tags)) tags = entry.tags;

                for (const tag of tags) {
                    if (tag && tag.trim()) tagsSet.add(tag);
                }
            }
        }

        // Include any globally-created tags
        for (const tag of globalTags) {
            if (tag && tag.trim()) tagsSet.add(tag);
        }

        // Base order for tie-breaking is alphabetical
        return Array.from(tagsSet).sort((a, b) => a.localeCompare(b));
    }

    /**
     * Attaches a dropdown of existing tags to a tag input.
     */
    attachTagSuggestions(input) {
        const container = input.closest(".user-tag-container");
        if (!container) return;

        const suggestionBox = DOM.createElement("div", {
            className: "user-tag-suggestions"
        });
        container.appendChild(suggestionBox);
        suggestionBox.style.display = "none";

        const showBox = () => {
            if (suggestionBox.childElementCount > 0) {
                suggestionBox.style.display = "block";
            }
        };

        const hideBox = () => {
            suggestionBox.style.display = "none";
        };

        const refreshSuggestions = () => {
            const allTags = this.getAllTags();
            const value = (input.value || "").toLowerCase();

            suggestionBox.innerHTML = "";

            const filtered = allTags.filter(tag =>
                !value || tag.toLowerCase().includes(value)
            );

            filtered.slice(0, 50).forEach(tagName => {
                const item = DOM.createElement(
                    "div",
                    { className: "user-tag-suggestion-item" },
                    tagName
                );
                item.addEventListener("mousedown", (e) => {
                    // Prevent input blur from firing before we set the value
                    e.preventDefault();
                    input.value = tagName;

                    // Trigger the existing input handler logic (saving, resizing, etc.)
                    input.dispatchEvent(new Event("input", { bubbles: true }));

                    hideBox();
                });
                suggestionBox.appendChild(item);
            });

            if (filtered.length > 0) showBox();
            else hideBox();
        };

        input.addEventListener("focus", () => {
            refreshSuggestions();
        });

        input.addEventListener("input", () => {
            refreshSuggestions();
        });

        input.addEventListener("blur", () => {
            // Small delay so clicks on suggestions can register
            setTimeout(() => hideBox(), 150);
        });
    }

    start() {
        DOM.addStyle(this._config.info.name, `
            .user-tag-container {
                display: flex;
                border: 1px solid var(--user-profile-border);
                border-radius: 5px;
                padding: 4px 6px;
                margin: 0 4px 4px 0;
                align-items: center;
                position: relative;
            }
            .user-tag-input {
                background-color: transparent;
                border: none;
                color: var(--interactive-active);
                font-size: 12px;
                font-weight: 500;
                font-family: var(--font-primary);
                flex: 1;
                white-space: nowrap;
                padding: 0;
                margin: 0;
                width: 10px;
                max-width: 250px;
            }
            .user-tag-cancel-button {
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 12px;
                height: 12px;
                margin-right: 4px;
                border-radius: 50%;
                padding: 0;
                flex-shrink: 0;
                background-color: rgb(185, 187, 190);
                cursor: pointer;
            }
            .btn-add-tag {
                border: 1px solid var(--user-profile-border);
                border-radius: var(--radius-sm);
                color: var(--interactive-normal);
                height: 24px;
                padding: 4px;
                width: fit-content;
                align-items: center;
                background: none;
                box-sizing: border-box;
                display: flex;
                font-size: 14px;
                font-weight: 500;
                justify-content: center;
                line-height: 16px;
                position: relative;
                user-select: none;
            }
            .btn-add-tag:hover {
                background-color: var(--user-profile-background-hover);
            }
            .user-tag-cancel-button-icon {
                width: 10px;
                top: 50%;
                left: 50%;
                fill: var(--interactive-normal);
            }
            .user-tag-body {
                display: flex;
                flex-wrap: wrap;
            }
            .user-tag-main {
                display: block;
            }
            .user-tag-title {
                font-size: 12px;
                font-weight: 700;
                font-family: var(--font-display);
                color: var(--header-secondary);
                margin-bottom: 8px;
                width: 100%;
            }
            .user-tag-add-button-icon {
                width: 16px;
                height: 16px;
                fill: var(--background-primary);
                cursor: pointer;
            }
            .user-tag-suggestions {
                position: absolute;
                left: 0;
                top: 100%;
                margin-top: 2px;
                background-color: var(--background-primary);
                border: 1px solid var(--background-tertiary);
                border-radius: 4px;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
                max-height: 180px;
                overflow-y: auto;
                z-index: 1000;
                min-width: 120px;
                padding: 2px 0;
            }
            .user-tag-suggestion-item {
                padding: 4px 8px;
                font-size: 12px;
                cursor: pointer;
                white-space: nowrap;
            }
            .user-tag-suggestion-item:hover {
                background-color: var(--background-secondary-alt);
            }

            /* Settings panel grid (CSS grid) */
            .usertags-settings-root {
                max-height: 80vh;
                max-width: 90vw;
                overflow: auto;
            }
            .usertags-settings {
                padding: 10px;
            }
            .usertags-settings h2 {
                margin-bottom: 8px;
            }
            .usertags-settings p {
                margin-bottom: 8px;
                font-size: 12px;
                color: var(--text-muted);
            }
            .usertags-count {
                font-size: 11px;
                margin-bottom: 2px;
                color: var(--text-muted);
            }
            .usertags-grid {
                border: 1px solid var(--background-tertiary);
                border-radius: 4px;
                overflow: hidden;
                max-height: calc(90vh - 220px);
                overflow-x: auto;
                overflow-y: auto;
            }
            .usertags-grid-inner {
                display: grid;
                grid-auto-rows: minmax(28px, auto);
                width: max-content;
            }
            .usertags-grid-header,
            .usertags-usercell,
            .usertags-cell {
                border-bottom: 1px solid var(--background-tertiary);
                border-right: 1px solid var(--background-tertiary);
                padding: 4px 6px;
                font-size: 12px;
                display: flex;
                align-items: center;
                box-sizing: border-box;
            }
            .usertags-grid-header {
                background-color: var(--background-secondary-alt); /* solid header background */
                font-weight: 600;
                position: sticky;
                top: 0;
                z-index: 3;
            }
            .usertags-grid-header-user {
                z-index: 4;
                left: 0;
                position: sticky;
                background-color: var(--background-secondary-alt); /* ensure corner is solid too */
            }
            .usertags-usercell {
                text-align: left;
                white-space: nowrap;
                position: sticky;
                left: 0;
                background-color: var(--background-secondary-alt);
                z-index: 2;
            }
            .usertags-cell {
                justify-content: center;
                cursor: pointer;
            }
            .usertags-cell.has-tag {
                background-color: var(--status-positive-background);
                color: var(--status-positive-text);
                font-weight: 600;
            }

            .usertags-header-cell {
                display: flex;
                align-items: center;
                position: relative;
                width: 100%;
            }
            .usertags-header-label {
                flex: 1;
                text-align: center;
                white-space: nowrap;
            }
            .usertags-col-resizer {
                position: absolute;
                right: -3px;
                top: 0;
                bottom: 0;
                width: 6px;
                cursor: col-resize;
                z-index: 5;
            }
            .usertags-col-resizer:hover {
                background-color: var(--background-tertiary);
            }

            .usertags-userinfo {
                display: flex;
                align-items: center;
                gap: 6px;
                cursor: pointer;
                width: 100%;
                min-width: 0;
            }
            .usertags-avatar {
                width: 24px;
                height: 24px;
                border-radius: 50%;
                flex-shrink: 0;
            }
            .usertags-username {
                text-overflow: ellipsis;
                overflow: hidden;
                white-space: nowrap;
                min-width: 0;
            }

            .usertags-toolbar {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                margin-bottom: 6px;
                gap: 8px;
            }
            .usertags-toolbar-left {
                display: flex;
                flex-direction: column;
                flex: 1 1 auto;
                min-width: 0;
            }
            .usertags-addtag-btn {
                padding: 4px 8px;
                font-size: 12px;
                border-radius: 4px;
                border: none;
                cursor: pointer;
                background-color: var(--button-secondary-background);
                color: var(--button-secondary-text);
                white-space: nowrap;
            }
            .usertags-addtag-btn:hover {
                background-color: var(--button-secondary-background-hover, var(--button-secondary-background));
            }
            .usertags-filter-input {
                font-size: 12px;
                padding: 3px 6px;
                border-radius: 4px;
                border: 1px solid var(--background-tertiary);
                background-color: var(--background-secondary);
                color: var(--text-normal);
                width: 100%;
                box-sizing: border-box;
            }
            .usertags-filter-input-error {
                border-color: var(--status-danger-text);
            }
            .usertags-filter-error {
                font-size: 11px;
                color: var(--status-danger-text);
                margin-top: 2px;
            }
            .usertags-tagfilter-pill {
                font-size: 11px;
                margin-top: 2px;
                color: var(--text-muted);
            }

            /* Hover highlights */
            .usertags-row-hover {
                background-color: rgba(255, 255, 255, 0.03);
            }
            .usertags-cell.has-tag.usertags-row-hover {
                background-color: var(--status-positive-background);
                box-shadow: 0 0 0 1px var(--background-tertiary) inset;
            }
            .usertags-col-hover {
                background-color: rgba(255, 255, 255, 0.03);
            }
            /* Keep column headers solid; just add outline */
            .usertags-col-hover-header {
                background-color: var(--background-secondary-alt);
                box-shadow: 0 0 0 1px var(--background-tertiary) inset;
            }
            .usertags-cell.has-tag.usertags-col-hover {
                background-color: var(--status-positive-background);
                box-shadow: 0 0 0 1px var(--background-tertiary) inset;
            }
            /* Keep the left User column solid on row hover */
            .usertags-usercell.usertags-row-hover {
                background-color: var(--background-secondary-alt);
                box-shadow: 0 0 0 1px var(--background-tertiary) inset;
            }

            .usertags-toolbar {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                margin-bottom: 6px;
                gap: 8px;
            }
            .usertags-toolbar-left {
                display: flex;
                flex-direction: column;
                flex: 1 1 auto;
                min-width: 0;
            }

            .usertags-channel-toolbar-button {
                margin-left: 6px;
                height: 32px;
            }

            .usertags-toolbar-icon {
                width: 20px;
                height: 20px;
                color: var(--interactive-normal);
            }

            .usertags-channel-toolbar-button:hover .usertags-toolbar-icon {
                color: var(--interactive-hover);
            }

            .bd-modal-root.bd-addon-modal:has(.usertags-settings),
            .bd-confirmation-modal:has(.usertags-settings) {
                width: min(90vw, 1200px);
                max-width: 95vw;
                max-height: 90vh;
                display: flex;
                flex-direction: column;
            }

            .bd-modal-root.bd-addon-modal:has(.usertags-settings) .bd-modal-inner,
            .bd-confirmation-modal:has(.usertags-settings) {
                max-height: 90vh;
                display: flex;
                flex-direction: column;
            }

            .bd-modal-root.bd-addon-modal:has(.usertags-settings) .bd-modal-body,
            .bd-confirmation-modal:has(.usertags-settings) .bd-modal-body {
                max-height: calc(90vh - 120px);
                flex: 1 1 auto;
                overflow: auto;
            }
        `);

        this.patchChannelHeaderToolbar();

        // SMALL USER PROFILE POPOUT
        const UserProfileModuleSmall = Webpack.getByStrings(
            ".pronouns",
            "UserProfilePopoutBody",
            "relationshipType",
            { defaultExport: false }
        );
        if (UserProfileModuleSmall) {
            BdApi.Patcher.after(
                "userProfileSmall",
                UserProfileModuleSmall,
                "Z",
                (_, [props], res) => {
                    if (!res || !res.props || !Array.isArray(res.props.children)) return res;

                    const tagSection = React.createElement(
                        "div",
                        { className: "user-tag-main" },
                        React.createElement("h3", { className: "user-tag-title" }, "Tags"),
                        this.runTags(props, res)
                    );

                    res.props.children.push(tagSection);
                    return res;
                }
            );
        } else {
            console.warn("[UserTags] Could not find UserProfileModuleSmall – small popout tags disabled.");
        }

        // FULL USER PROFILE
        const UserProfileModuleFull = Webpack.getByStrings(
            "trackUserProfileAction",
            "displayProfile",
            ".hidePersonalInformation",
            { defaultExport: false }
        );
        if (UserProfileModuleFull) {
            BdApi.Patcher.after(
                "userProfileFull",
                UserProfileModuleFull,
                "Z",
                (_, [props], res) => {
                    if (!res || !res.props || !Array.isArray(res.props.children) || !res.props.children[4]) return res;

                    res.props.children[4].props.heading = "Tags";
                    res.props.children[4].props.children = this.runTags(props, res);
                    return res;
                }
            );
        } else {
            console.warn("[UserTags] Could not find UserProfileModuleFull – full profile tags disabled.");
        }

        // QUICK SWITCHER (&tag search)
        const QuickSwitcherModule = Webpack.getByStrings(
            "QuickSwitcher",
            ".searchableTitles",
            { defaultExport: false }
        );
        if (QuickSwitcherModule) {
            BdApi.Patcher.after(
                "QuickSwitcher",
                QuickSwitcherModule,
                "Z",
                (that, args, res) => {
                    if (!res || !res.props) return res;

                    let query = res.props.query;
                    if (query?.startsWith("&")) {
                        let users = (res.props.results = []);
                        query = query.substring(1);
                        const keywords = query.split(" ").filter(Boolean);
                        const data = Data.load(this._config.info.name, "UserData") || {};
                        let userIds = [];

                        function getTagsForEntry(entry) {
                            if (Array.isArray(entry)) return entry;
                            if (entry && Array.isArray(entry.tags)) return entry.tags;
                            return [];
                        }

                        function findUsers(keywords, data) {
                            if (keywords.length === 0) return [];
                            const found = [];
                            for (let userId in data) {
                                const entry = data[userId];
                                const userTags = getTagsForEntry(entry);
                                for (let i = 0; i < keywords.length; i++) {
                                    const kw = keywords[i];
                                    if (!kw) continue;
                                    if (kw.startsWith("!")) {
                                        const needle = kw.substring(1).toLowerCase();
                                        if (!userTags.some(tag => tag.toLowerCase().includes(needle))) {
                                            found.push(userId);
                                        }
                                    } else {
                                        const needle = kw.toLowerCase();
                                        if (userTags.some(tag => tag.toLowerCase().includes(needle))) {
                                            found.push(userId);
                                        }
                                    }
                                }
                            }
                            return found;
                        }

                        userIds = findUsers(keywords, data);

                        for (let i = 0; i < userIds.length; i++) {
                            if (users.some(user => user.record.id === userIds[i])) continue;
                            const user = StoreModules.UserStore.getUser(userIds[i]);
                            if (user) {
                                users.push({
                                    comparator: user.username,
                                    record: user,
                                    type: "USER"
                                });
                            }
                        }
                    }

                    return res;
                }
            );
        } else {
            console.warn("[UserTags] Could not find QuickSwitcher module – tag search disabled.");
        }

        this.checkForChangelog();
    }

    stop() {
        BdApi.Patcher.unpatchAll(this.getName());
        BdApi.Patcher.unpatchAll("userProfileSmall");
        BdApi.Patcher.unpatchAll("userProfileFull");
        BdApi.Patcher.unpatchAll("QuickSwitcher");
        BdApi.Patcher.unpatchAll("UserTagsChannelHeaderToolbar");
        DOM.removeStyle(this._config.info.name);
    }

    runTags(props, ret) {
        const addIcon = React.createElement(
            "svg",
            {
                viewBox: "0 0 24 24",
                height: "32",
                width: "32",
                className: "user-tag-add-button-icon"
            },
            React.createElement("path", {
                fill: "currentColor",
                d: "M13 6a1 1 0 1 0-2 0v5H6a1 1 0 1 0 0 2h5v5a1 1 0 1 0 2 0v-5h5a1 1 0 1 0 0-2h-5V6Z"
            })
        );

        const setupUserTags = React.createElement(
            React.Fragment,
            { key: "userTags" },
            React.createElement(
                "div",
                {
                    className: "user-tag-body flex-3BkGQD wrap-7NZuTn"
                },
                React.createElement(
                    "button",
                    {
                        className: "btn-add-tag",
                        onClick: () => {
                            this.createTagPending(props.user.id);
                        }
                    },
                    addIcon
                )
            )
        );

        if (!this.userPopoutPatched) {
            const data = Data.load(this._config.info.name, "UserData") || {};
            const entry = this.getOrInitUserEntry(data, props.user.id);
            const userTags = entry.tags || [];

            if (userTags.length > 0) {
                for (let i = 0; i < userTags.length; i++) {
                    if (userTags[i]) {
                        this.createTagPending(props.user.id, userTags[i]);
                    }
                }
            }

            // Persist any upgrade from legacy format (arrays) to the new format + TagIndex
            this.saveUserData(data);
            this.userPopoutPatched = true;
        }

        return setupUserTags;
    }

    createTagPending(userId, tag = null) {
        const div = DOM.createElement("div", {
            className: "user-tag-container",
            draggable: true,
            id: crypto.randomUUID()
        });

        const cancelButtonIcon = DOM.createElement("span", {
            className: "user-tag-cancel-button-icon"
        });

        const cancelButton = DOM.createElement("div", {
            className: "user-tag-cancel-button"
        }, cancelButtonIcon);

        const input = DOM.createElement("input", {
            className: "user-tag-input",
            type: "text",
            maxLength: 60,
            placeholder: "Tag"
        });

        div.append(cancelButton, input);

        const insertTarget = document.querySelector(".btn-add-tag");
        if (insertTarget && insertTarget.parentElement) {
            insertTarget.parentElement.insertBefore(div, insertTarget);
            this.userPopoutPatched = true;
        }

        // Attach suggestions dropdown
        this.attachTagSuggestions(input);

        if (tag) {
            input.value = tag;
            input.style.width = "0";
            input.style.width = `${input.scrollWidth}px`;
        } else {
            input.focus();
            input.select();
        }

        // Hover effect on cancel button
        div.addEventListener("mouseenter", () => {
            if (!cancelButtonIcon.querySelector("svg")) {
                const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                svg.setAttribute("width", "26");
                svg.setAttribute("height", "26");
                svg.setAttribute("viewBox", "0 0 60 20");
                svg.setAttribute("aria-hidden", "true");

                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                path.setAttribute("fill", "#2f3136");
                path.setAttribute("d", "M18.4 4L12 10.4L5.6 4L4 5.6L10.4 12L4 18.4L5.6 20L12 13.6L18.4 20L20 18.4L13.6 12L20 5.6L18.4 4Z");

                svg.appendChild(path);
                cancelButtonIcon.appendChild(svg);
            }
        });

        div.addEventListener("mouseleave", () => {
            const svg = cancelButtonIcon.querySelector("svg");
            if (svg) svg.remove();
        });

        // Drag & drop reorder
        div.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", div.id);
        });

        div.addEventListener("dragover", (e) => e.preventDefault());

        div.addEventListener("drop", (e) => {
            e.preventDefault();
            const draggedId = e.dataTransfer.getData("text/plain");
            const parent = e.currentTarget.parentElement;
            if (!parent) return;

            const dragged = document.getElementById(draggedId);
            if (!dragged || dragged === div) return;

            parent.insertBefore(dragged, div);

            const data = Data.load(this._config.info.name, "UserData") || {};
            const entry = this.getOrInitUserEntry(data, userId);
            const inputs = parent.querySelectorAll(".user-tag-container .user-tag-input");

            entry.tags = Array.from(inputs)
                .map(i => i.value)
                .filter(v => v && v.trim().length > 0);

            this.saveUserData(data);
        });

        // Input changes (save + resize)
        input.addEventListener("input", (e) => {
            const data = Data.load(this._config.info.name, "UserData") || {};
            const parent = e.target.parentElement?.parentElement;
            if (!parent) return;

            const entry = this.getOrInitUserEntry(data, userId);
            const inputs = Array.from(parent.querySelectorAll(".user-tag-input"));
            const index = inputs.indexOf(e.target);

            // NOTE: Only [a-zA-Z0-9_]. If you want spaces/hyphens, loosen this regex.
            e.target.value = e.target.value.replace(/[^a-zA-Z0-9_]/g, "");

            e.target.style.width = "0";
            e.target.style.width = e.target.scrollWidth + "px";

            if (index !== -1) {
                entry.tags[index] = e.target.value;
            }

            this.saveUserData(data);
        });

        cancelButton.addEventListener("click", (e) => {
            const tagDiv = e.target.closest(".user-tag-container");
            const parent = tagDiv?.parentElement;
            if (!tagDiv || !parent) return;

            const input = tagDiv.querySelector(".user-tag-input");
            const inputs = Array.from(parent.querySelectorAll(".user-tag-input"));
            const index = inputs.indexOf(input);

            const data = Data.load(this._config.info.name, "UserData") || {};
            const entry = this.getOrInitUserEntry(data, userId);

            if (index !== -1) {
                entry.tags.splice(index, 1);
                if (entry.tags.length === 0) {
                    delete data[userId];
                }
                this.saveUserData(data);
            }

            tagDiv.remove();
        });
    }

    /**
     * Shared overview UI: clickable + resizable CSS grid of Friends+TaggedUsers × Tags.
     */
    renderOverviewPanel() {
        return React.createElement(UserTagsOverview, { plugin: this });
    }

    /**
     * Build the settings UI into a provided container.
     */
    buildSettingsUI(container) {
        if (!container) return null;
        if (BdApi?.ReactDOM?.render) {
            BdApi.ReactDOM.render(this.renderOverviewPanel(), container);
        }
        return container;
    }

    /**
     * Settings panel: reuse the overview panel wrapped in a single root element.
     */
    getSettingsPanel() {
        const container = document.createElement("div");
        container.className = "usertags-settings-root";
        this.buildSettingsUI(container);
        return container;
    }

    openOverviewModal() {
        this.showSettingsModal();
    }

    openSettingsFromToolbar() {
        this.showSettingsModal();
    }

    openSettingsModalFromToolbar() {
        this.showSettingsModal();
    }

    showSettingsModal() {
        if (BdApi?.Plugins?.showAddonSettingsModal) {
            BdApi.Plugins.showAddonSettingsModal(this.getName(), this);
            return;
        }

        const openAddonSettings =
            UI?.showAddonSettingsModal ||
            UI?.openAddonSettingsModal ||
            UI?.showAddonSettings ||
            UI?.openAddonSettings;

        if (typeof openAddonSettings === "function") {
            openAddonSettings(this.getName());
            return;
        }

        console.warn("[UserTags] Could not locate BetterDiscord addon settings modal API to open the overview.");
    }

    patchChannelHeaderToolbar() {
        if (!ChannelHeader || !ChannelHeaderKey) {
            console.warn("[UserTags] Could not find channel header toolbar module – toolbar button disabled.");
            return;
        }

        BdApi.Patcher.after(
            this.getName(),
            ChannelHeader,
            ChannelHeaderKey,
            (_, [{ toolbar }], returnValue) => {
                if (!toolbar) return returnValue;

                const ToolbarArray = BdApi.Utils.findInTree(
                    toolbar,
                    (prop) => Array.isArray(prop) && prop.some((element) => element?.key === "pins"),
                    { walkable: ["props", "children"] }
                );

                if (!Array.isArray(ToolbarArray)) return returnValue;

                if (ToolbarArray.some((element) => element?.props?.["data-usetags-toolbar-button"] || element?.props?.["aria-label"] === "UserTags Settings")) {
                    return returnValue;
                }

                ToolbarArray.unshift(
                    BdApi.React.createElement(ToolbarComponent, {
                        onClick: () => this.openSettingsFromToolbar(),
                        key: "usertags-toolbar-button"
                    })
                );

                return returnValue;
            }
        );
    }

    checkForChangelog() {
        try {
            let currentVersionInfo = {};
            try {
                currentVersionInfo = Object.assign(
                    {},
                    { version: this._config.info.version, hasShownChangelog: false },
                    Data.load(this._config.info.name, "currentVersionInfo")
                );
            } catch (err) {
                currentVersionInfo = { version: this._config.info.version, hasShownChangelog: false };
            }

            if (this._config.info.version !== currentVersionInfo.version) {
                currentVersionInfo.hasShownChangelog = false;
            }

            currentVersionInfo.version = this._config.info.version;
            Data.save(this._config.info.name, "currentVersionInfo", currentVersionInfo);

            if (!currentVersionInfo.hasShownChangelog) {
                UI.showChangelogModal({
                    title: "UserTags Changelog",
                    subtitle: this._config.info.version,
                    changes: this._config.changelog
                });
                currentVersionInfo.hasShownChangelog = true;
                Data.save(this._config.info.name, "currentVersionInfo", currentVersionInfo);
            }
        } catch (err) {
            console.error(this._config.info.name, err);
        }
    }
}

module.exports = UserTags;
