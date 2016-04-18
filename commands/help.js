'use strict';


module.exports = exports = (bot) => {
  bot.onText(/\/help/i, (message) => {
    bot.sendMessage(message.chat.id, [
      '메일봇에는 다음 명령들이 있습니다.',
      '',
      '/setusername',
      '- 이메일 주소를 변경합니다.',
      '',
      '/getusername',
      '- 설정된 이메일주소를 출력합니다.',
      '/help',
      '- 이 메세지를 출력합니다.',
      '',
      '',
      '메일봇은 무료로 운영중인 서비스입니다.',
      '개발자 Telegram: @mooyoul',
      '개발자가 만든 좋은 변호사 찾는 로톡: https://www.lawtalk.co.kr/tg3',
      '메일봇 Github: https://github.com/mooyoul/telegrambot-mailgram'
    ].join('\n'));
  });
};