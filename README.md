# kurento_rtp_output_sample

これは WebRTC Advent Calendar 2017の9日目の記事です。

## 内容
WebRTCのMediaServerでRTPで配信するとき方法のサンプルです。

## 使い方
1. 使い方はこのリポジトリをクローンしてください
1. npm installしてください
1. src/output.sdpの下記のラインをRTPを受信するPCのIPアドレスに書き換えてください

  c=IN IP4 192.168.11.4
