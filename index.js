require('dotenv').config();
const { Client, GatewayIntentBits, Partials, EmbedBuilder, REST, Routes, SlashCommandBuilder } = require('discord.js');
// Biến lưu trữ dữ liệu người truy cập web gần nhất
let lastVisitorData = null;

// Thêm server mini để nhận dữ liệu từ web
const express = require('express');
const cors = require('cors');
const app = express();
app.use(express.json());
app.use(cors());

app.post('/log-visitor', (req, res) => {
    const { ip, device } = req.body;
    lastVisitorData = { ip, device, time: new Date().toLocaleTimeString() };
    console.log("Đã lưu dữ liệu từ web:", lastVisitorData);
    res.status(200).send('OK');
});

app.listen(3000, () => console.log('Bot đang đợi dữ liệu từ website...'));
// Điền Token và Client ID của bot vào đây
const CLIENT_ID = '1513050611036455032'; // Lấy ở mục General Information trong Developer Portal
const fakeIP = `104.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`; // IP ngẫu nhiên bắt đầu bằng 104 (IP thường thấy ở California)
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.Channel, Partials.Message] // Thêm Partials.Message
});
// Định nghĩa cấu trúc lệnh /hack
const commands = [
    new SlashCommandBuilder()
        .setName('hack')
        .setDescription('Tạo bảng rò rỉ dữ liệu')
        .addUserOption(option => 
            option.setName('muc_tieu')
                .setDescription('Chọn người bạn muốn hack')
                .setRequired(true)
        )
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

// Đăng ký lệnh với hệ thống Discord khi bot khởi động
client.once('clientReady', async () => {
    console.log(`✅ Bot đã sẵn sàng: ${client.user.tag}`);
    client.on('error', (error) => {
    console.error('Lỗi kết nối:', error);
});
    try {
        // 2. Đăng ký lệnh toàn cục (dùng được cả trong DM và mọi server)
        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands },
        );
        console.log('✅ Đã đồng bộ lệnh toàn cục thành công!');
        // --- THÊM ĐOẠN NÀY ĐỂ KIỂM TRA ---
        const currentCommands = await rest.get(Routes.applicationCommands(CLIENT_ID));
        console.log('Danh sách lệnh hiện tại trên Discord:', currentCommands);
        // ---------------------------------
    } catch (error) {
        console.error('Lỗi khi làm mới lệnh:', error);
    }
});

// Xử lý khi có người gõ lệnh /hack
client.on('interactionCreate', async interaction => {
    // Bỏ qua nếu không phải là lệnh slash
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'hack') {
        // Lấy thông tin người dùng được chọn từ tùy chọn 'muc_tieu'
        const target = interaction.options.getUser('muc_tieu');

        const ipValue = lastVisitorData ? `\`${lastVisitorData.ip}\`` : "N/A";
    const deviceValue = lastVisitorData ? `\`${lastVisitorData.device}\`` : "N/A";
        
        // Hàm tạo token giả
        const base64Id = Buffer.from(target.id).toString('base64').replace(/=/g, '');
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
        let randomString1 = '', randomString2 = '';
        for (let i = 0; i < 6; i++) randomString1 += charset.charAt(Math.floor(Math.random() * charset.length));
        for (let i = 0; i < 27; i++) randomString2 += charset.charAt(Math.floor(Math.random() * charset.length));
        const fakeToken = `${base64Id}.${randomString1}.${randomString2}`;

        // Xây dựng bảng Embed
        const hackEmbed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('🚨 TRÍCH XUẤT DỮ LIỆU 🚨')
            .setDescription('Hệ thống đã trích xuất thành công dữ liệu của mục tiêu.')
            .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: '👤 Tên người dùng', value: `**${target.username}**`, inline: true },
                { name: '📍 Địa chỉ IP', value: ipValue, inline: false },
                { name: '📱 Thiết bị', value: deviceValue, inline: true },
                { name: '🆔 User ID', value: `\`${target.id}\``, inline: true },
                { name: '🔑 Token (Đã giải mã)', value: `\`${fakeToken}\``, inline: false }
            )
            .setTimestamp();

        // Phản hồi lại lệnh của người dùng
        await interaction.reply({ embeds: [hackEmbed] });
    }
});
client.on('messageCreate', (message) => {
    if (message.author.bot) return; // Nếu tin nhắn là của bot thì bỏ qua
    if (message.content === 'ping') {
        message.reply('Pong!'); // Nếu tin nhắn là "ping" thì trả lời "Pong!"
    }
});
console.log("Token đang dùng là: ", process.env.TOKEN);
client.login(process.env.TOKEN);
