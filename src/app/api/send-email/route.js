import nodemailer from 'nodemailer';

export async function POST(req) {
    try {
        // Получаем данные из тела запроса
        const { name, phone, comment, agreement } = await req.json();

        // Настройка транспортера для отправки писем через SMTP
        const transporter = nodemailer.createTransport({
            service: 'gmail', // Укажите вашу почтовую службу (Gmail, Yandex, и т.д.)
            auth: {
                user: 'nestwedman@gmail.com', // Ваша почта
                pass: 'your-email-password-or-app-password', // Пароль или app-password (для Gmail)
            },
        });

        // Формируем письмо
        const mailOptions = {
            from: 'nestwedman@gmail.com', // Отправитель
            to: 'nestwedman@gmail.com', // Получатель
            subject: 'Новая заявка с формы',
            text: `Имя: ${name}\nТелефон: ${phone}\nКомментарий: ${comment}\nСогласие на обработку данных: ${agreement ? 'Да' : 'Нет'}`,
        };

        // Отправляем письмо
        await transporter.sendMail(mailOptions);

        return new Response(JSON.stringify({ message: 'Email sent successfully!' }), { status: 200 });
    } catch (error) {
        console.error('Error sending email:', error);
        return new Response(JSON.stringify({ error: 'Failed to send email' }), { status: 500 });
    }
}