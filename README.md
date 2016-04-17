# telegrambot-mailgram

[![Dependency Status](https://david-dm.org/mooyoul/telegrambot-mailgram.svg)](https://david-dm.org/mooyoul/telegrambot-mailgram) [![Known Vulnerabilities](https://snyk.io/test/github/mooyoul/telegrambot-mailgram/badge.svg)](https://snyk.io/test/github/mooyoul/telegrambot-mailgram) [![MIT license](http://img.shields.io/badge/license-MIT-blue.svg)](http://mooyoul.mit-license.org/)
[![Author Telegram](https://img.shields.io/badge/Telegram-%40mooyoul-blue.svg)](https://telegram.me/mooyoul) [![MailgramBot Telegram](https://img.shields.io/badge/Telegram-%40MailgramBot-blue.svg)](https://telegram.me/MailgramBot)

Telegram Bot API를 사용하는 메일 인바운드 봇
이메일 클라이언트 없이 텔레그램으로 바로 이메일을 받아보세요.

## Screencast
[![Youtube Screencast Thumbnail](https://i.ytimg.com/vi/xm4MFdldNI0/hqdefault.jpg)](https://youtu.be/xm4MFdldNI0)


## Screenshots
![Screenshot 1](https://raw.githubusercontent.com/mooyoul/telegrambot-mailgram/master/images/mailgram_01.png)

![Screenshot 2](https://raw.githubusercontent.com/mooyoul/telegrambot-mailgram/master/images/mailgram_02.png)

![Screenshot 3](https://raw.githubusercontent.com/mooyoul/telegrambot-mailgram/master/images/mailgram_03.png)

![Screenshot 4](https://raw.githubusercontent.com/mooyoul/telegrambot-mailgram/master/images/mailgram_04.png)


## Requirements

* Node.js >= 4
* MongoDB >= 3
* Telegram Bot API Key
* Amazon S3 (Amazon Simple Storage) with AWS Key
* Spamassassin with spamc

## Installing Dependencies
본 텔레그램 봇은 [mailin](https://github.com/Flolagale/mailin) 패키지를 사용합니다.
mailin 패키지를 사용하기 위해, spamassassin과 spamc 패키지를 설치해야 합니다.

```bash
$ # on Debian / Ubuntu
$ sudo apt-get install spamassassin spamc
```

자세한 의존성 설치 가이드는 [mailin 프로젝트의 Initial Setup 섹션을 참조하세요.](https://github.com/Flolagale/mailin#initial-setup)

## Configuring MX Record
메일을 수신하기 위해 도메인에 올바른 MX 레코드가 설정되어 있어야 합니다.

이 역시 [mailin 프로젝트의 The crux: setting up your DNS correctly](https://github.com/Flolagale/mailin#the-crux-setting-up-your-dns-correctly) 섹션을 참조하세요.

또는, `dig` 명령을 사용하여 터미널 상에서 MX 레코드 설정을 직접 확인할 수도 있습니다.
```bash
$ # Check MX Record on specified domain
$ dig example.com mx
$ # Check MX Record on specified domain using Google DNS
$ dig @8.8.8.8 example.com mx
```

## Testing SMTP Configuration
의존성과 MX 레코드 설정이 모두 끝났으면, [MXToolbox에서 제공하는 SMTP Diagnostics Tool](http://mxtoolbox.com/diagnostic.aspx)을 사용해 설정을 테스트 할 수 있습니다.

메일을 올바르게 수신하기 위해, 반드시 위 테스트 도구를 방문하여 구성이 올바른지 확인하세요.

## Listening on port 25
기본적으로 1000번 이하 포트 대역은 root 사용자를 위해 예약되어 있습니다.
이를 사용하기 위해서는, 서버를 root 사용자로 실행하거나, [authbind](http://respectthecode.tumblr.com/post/16461876216/using-authbind-to-run-node-js-on-port-80-with-dreamhost)를 사용하세요.


## Getting Started
```bash
$ git clone https://github.com/mooyoul/telegrambot-mailgram.git
$ cd telegrambot-mailgram
$ npm install
$ cp .env.example .env
$ vi .env # You must edit configurations!
```

### Running server
```bash
$ node server.js
```

## Known Issues
현재 다음과 같은 알려진 이슈가 있습니다:

##### 일부 모바일 단말에서 첨부파일로 전송한 이메일에 포함된 이미지를 표시할 수 없음
테스트로 사용한 iOS 단말에서, 첨부파일로 전송한 이메일에 포함된 이미지를 표시할 수 없는 문제가 있습니다.
Telegram Client에 탑재된 WebView의 Cross Origin Issue로 추측되나,
base64 embedding을 통해서도 해결되지 않는 것을 보면 아예 외부 리소스 접근을 허용하지 않는 것 같습니다.

해당 이슈를 해결하기 위해서, S3 Bucket에 이메일을 업로드하여 사용자에게 전송하는 방법을 통해 이를 우회하고 있습니다.

데스크탑 클라이언트에서는 해당 사항에 대해 이슈가 발생하지 않는 것을 확인했습니다.

##### 첨부파일 누락
초기 버전이라 첨부파일 포워딩은 지원하지 않습니다.

##### UTF-8이 아닌 이메일은 인코딩이 망가질 수 있음
요즘 거의 모든 메일들이 UTF-8로 송/수신 되고 있지만, 아직도 드문 환경에서 EUC-KR를 사용하는 곳이 있습니다.
제가 EUC-KR로 된 샘플 메일이 없어서 테스트는 못해봤습니다만, 아마 해당 이메일은 깨져보일 확률이 높습니다.


## License
[MIT](LICENSE)

See full license on [mooyoul.mit-license.org](http://mooyoul.mit-license.org/)