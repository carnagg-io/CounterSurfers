import { DiscordSDK } from "@discord/embedded-app-sdk";

import './style.css';
import rocketLogo from '/rocket.png';

const sdkDiscord = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);

let auth;

setupDiscordSDK().then(() =>
{
  console.log("Discord SDK is authenticated.");

  appendVoiceChannelName();
  appendGuildAvatar();
});

async function setupDiscordSDK()
{
  await sdkDiscord.ready();
  console.log("Discord SDK is ready.");

  // 1. Authorize with the Discord client.
  const { code } = await sdkDiscord.commands.authorize({
    client_id: import.meta.env.VITE_DISCORD_CLIENT_ID,
    response_type: "code",
    state: "",
    prompt: "none",
    scope: [ "identify", "guilds" ]
  });

  // 2. Retrieve an access token from the Activity's server.
  const response = await fetch("/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code })
  });
  const { access_token } = await response.json();

  // 3. Authenticate with Discord client (using access token).
  auth = await sdkDiscord.commands.authenticate({ access_token });

  // 4. Check the authentication.
  if (auth == null) {
    throw new Error("ERROR: Authenticate command failed.");
  }
}

async function appendVoiceChannelName()
{
  const app = document.querySelector('#app');

  let nameChannel = 'Unknown';

  if (sdkDiscord.channelId != null && sdkDiscord.guildId != null) {
    const channel = await sdkDiscord.commands.getChannel({channel_id: sdkDiscord.channelId});
    if (channel.name != null) {
      nameChannel = channel.name;
    }
  }

  const tagStr = `Activity Channel: "${nameChannel}"`;
  const tag = document.createElement('p');
  tag.textContent = tagStr;
  app.appendChild(tag);
}

async function appendGuildAvatar()
{
  const app = document.querySelector('#app');

  const guilds = await fetch("https://discord.com/api/v10/users/@me/guilds", {
    headers: {
      Authorization: `Bearer ${auth.access_token}`,
      'Content-Type': 'application/json'
    }
  }).then((response) => response.json());

  const guildCurr = guilds.find((g) => g.id === sdkDiscord.guildId);

  if (guildCurr != null) {
    const imgGuild = document.createElement('img');
    imgGuild.setAttributes(
      'src',
      `https://cdn.discordapp.com/icons/${guildCurr.id}/${guildCurr.icon}.webp?size=128`
    );
    imgGuild.setAttribute('width', '128px');
    imgGuild.setAttribute('height', '128px');
    imgGuild.setAttribute('style', 'border-radius: 50%;');
    app.appendChild(imgGuild);
  }
}

document.querySelector('#app').innerHTML = `
  <div>
    <img src="${rocketLogo}" class="logo" alt="Discord" />
    <h1>Hello, World!!!!!!!</h1>
  </div>
`;