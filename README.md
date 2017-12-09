# kurento_rtp_output_sample

これは WebRTC Advent Calendar 2017の9日目の記事です。

## 内容
WebRTCのMediaServerでRTPで配信するとき方法のサンプルです。

## 準備
FFMPEGをパスの通る状態にしてください
Kurento Mediaサーバを準備してください

## 注意
余計なコードが入っている為、無意味にFFMPEGでconfig.ymlのffmpeg_commandにあるコマンドを実行します。

## 使い方
1. このリポジトリをクローンしてください
1. npm installしてください
1. src/output.sdpの下記のラインをRTPを受信するPCのIPアドレスに書き換えてください
> c=IN IP4 192.168.11.4
1. src/config.ymlの下記のラインを書き換えてください
> kurento:
>   ws_url: ws://192.168.11.10:8888/kurento (Kurentoのws APIのurl)
> player:
>   src: file:///home/test/mp4_h264_aac.mp4 (Kurentoがあるサーバ上にある動画ファイルへのパス)
1. npm startしてください
1. RTPを受信するPCで下記コマンドを入力してください。Kurento上に置いた動画をRTPで受信できます。
> ffplay src\output.sdp -protocol_whitelist file,udp,rtp

## 解説
KurentoのPlayer EndpointをRTP Endpointにつなげて、RTP配信してます。
PlayerEndpointをWebRTC Endpointに置き換えればブラウザからRTP配信ができます。
RTPEndpointが動くコードがネット上にあまりなかったので参考になればと思いコードをさらしています。

## お詫び
時間足らなくて中途半端な内容になってしまいました。
そのうち清書します・・・・
ごめんなさい。
