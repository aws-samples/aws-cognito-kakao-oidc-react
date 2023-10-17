
export const lambdaHandler = async (event, context) => {
    try {
        const quotes = [
            "The present moment is all you ever have.",
            "In the stillness, you will find your true self.",
            "Let go of what was and embrace what is.",
            "Peace comes from within. Do not seek it without. - Buddha",
            "Your breath is your anchor in the chaos of life.",
            "Meditation is the journey from sound to silence, from movement to stillness.",
            "Wherever you go, there you are. - Jon Kabat-Zinn",
            "When you talk, you are only repeating what you already know. But if you listen, you may learn something new. - Dalai Lama",
            "Surrender to what is, let go of what was, have faith in what will be.",
            "The quieter you become, the more you can hear. - Ram Dass",
            "The soul always knows what to do to heal itself. The challenge is to silence the mind. - Caroline Myss",
            "Happiness is not something ready made. It comes from your own actions. - Dalai Lama",
            "You are not a drop in the ocean; you are the entire ocean in a drop. - Rumi",
            "The more you know yourself, the more you will forgive yourself. - Confucius",
            "In meditation, you can find stillness in the chaos. - Unknown",
            "In the depth of meditation, the fragrance of the divine can be smelled. - Bhagavad Gita",
            "Do not dwell in the past; do not dream of the future. Concentrate the mind on the present moment. - Buddha",
            "To understand the immeasurable, the mind must be extraordinarily quiet, still. - Jiddu Krishnamurti",
            "Silence is a source of great strength. - Lao Tzu",
            "The goal of meditation isn't to control your thoughts; it's to stop letting them control you."
        ];
        
        const randomIndex = Math.floor(Math.random() * quotes.length);
        const randomQuote = quotes[randomIndex];
         
        return {
            'statusCode': 200,
            'headers': {
                "Access-Control-Allow-Headers" : "Content-Type",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
            },
            'body': JSON.stringify({
                message: randomQuote,
            })
        };
    } catch (err) {
        console.log(err);
        return err;
    }
};
