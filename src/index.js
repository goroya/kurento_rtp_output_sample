require('date-utils');
const path = require('path');
const url = require('url');
const fs = require('fs');
const {spawn} = require('child_process');
const fse = require('fs-extra');
const yaml = require('js-yaml');
const axios = require('axios');
const kurento = require('kurento-client');


(async () => {
    console.log('Start');

    const dt = new Date();
    const nowTime = dt.toFormat('YYYYMMDD_HH24MISS');
    try {
        const config = yaml.safeLoad(
            fs.readFileSync(
                path.join(
                    __dirname, 'config.yml'
                ),
                'utf8'
            )
        );
        console.log('config is ', config);

        const fileName = path.basename(url.parse(config.video.src).path);
        const videoFilePath = path.join(
            __dirname, 'video', fileName
        );
        if (fse.pathExistsSync(videoFilePath) === false) {
            console.log('Download Video File');
            const responce = await axios.request({
                responseType: 'arraybuffer',
                url: config.video.src,
                method: 'get',
            });
            fse.outputFileSync(
                videoFilePath,
                responce.data
            );
            console.log('Downloaded Video File');
        }
        const inputSdp = await new Promise(
            (resolve, reject) => {
                // テンプレート中に含める変数
                const video_path = videoFilePath;
                const ffmpegCmd = eval('`' + config.ffmpeg_command + '`');

                const ffmpegSpawn = spawn(ffmpegCmd, [], {shell: true});
                ffmpegSpawn.stdout.on('data', (data) => {
                    let sdp = data.toString().replace(/SDP:/g, '');
                    sdp = sdp.toString().replace(/\r\n/g, '');
                    const sdpFilePath = path.join(
                        __dirname, 'sdp', 'ffmpeg.sdp'
                    );
                    fse.outputFileSync(
                        sdpFilePath,
                        sdp
                    );
                    const fromSdp = fs.readFileSync(sdpFilePath, 'utf-8');
                    console.log(fromSdp);
                    resolve(fromSdp);
                });
            }
        );
        // kurentoClient生成
        const {kurentoClient} = await new Promise((resolve, reject) => {
            kurento.getSingleton(
                config.kurento.ws_url, {},
                (error, kurentoClient) => {
                    if (error) {
                        reject(error);
                    }
                    resolve({kurentoClient});
                }
            );
        });
        // PipeLine生成
        const {pipeline} = await new Promise((resolve, reject) => {
            kurentoClient.create('MediaPipeline', (error, pipeline) => {
                if (error) {
                    reject(error);
                }
                resolve({pipeline});
            });
        });
        // RTP Endpoint生成
        const {rtpEndpointDst} = await new Promise(
            (resolve, reject) => {
                pipeline.create('RtpEndpoint', (error, rtpEndpointDst) => {
                        if (error) {
                            reject(error);
                        }
                        resolve({rtpEndpointDst});
                    }
                );
            }
        );
        addEventRtpEp(rtpEndpointDst, 'RTP Dst');
        // Player Endpoint生成
        const {playerEndpoint} = await new Promise((resolve, reject) => {
            pipeline.create(
                'PlayerEndpoint',
                {uri: 'file:///home/test/Desktop/mp4_h264_aac.mp4'},
                (error, playerEndpoint) => {
                    if (error) {
                        reject(error);
                    }
                    resolve({playerEndpoint});
                }
            );
        });
        playerEndpoint.on('EndOfStream', (event) => {
            console.log('playerEndpoint : -> EndOfStream', event);
        });
        // Player Endpoint -> RTP Endpointを接続
        await new Promise((resolve, reject) => {
            playerEndpoint.connect(rtpEndpointDst, (error) => {
                if (error) {
                    reject(error);
                }
                resolve();
            });
        });
        console.log('playerEndpoint -> RtpEndpointForPlayer Connected');
        // PlayerEndPointで配信開始
        await new Promise((resolve, reject) => {
            playerEndpoint.play((error) => {
                if (error) {
                    reject(error);
                }
                resolve();
            });
        });
        console.log('playerEndpoint Play OK');
        // RTPの配信開始
        await new Promise((resolve, reject) => {
            const inputSdp = fs.readFileSync(
                path.join(__dirname, 'output.sdp'), 'utf-8'
            );
            rtpEndpointDst.processOffer(
                inputSdp, (error, answer) => {
                    if (error) {
                        reject(error);
                    }
                    console.log(answer);
                    resolve(answer);
                }
            );
        });
        function addEventRtpEp(rtpEp, label) {
            rtpEp.on('ConnectionStateChanged', (State) => {
                console.log(
                    `${label}: -> ConnectionStateChanged ${State.oldState} -> ${State.newState}`
                );
            });
            rtpEp.on('ElementConnected', (response) => {
                console.log(label + ': -> ElementConnected' );
            });
            rtpEp.on('ElementDisconnected', (sink, mediaType, srcMDesc, sinkMDesc) => {
                console.log(label + ': -> ElementDisconnected' );
                console.log(label + ': srcMDesc   ' + srcMDesc);
                console.log(label + ': sinkMDesc  ' + sinkMDesc);
            });
            rtpEp.on('Error', function(response) {
                console.log(label + ': -> Error' );
            });
            rtpEp.on('MediaFlowInStateChange', function(response) {
                console.log(label + ': -> MediaFlowInStateChange' );
            });
            rtpEp.on('MediaFlowOutStateChange', function(response) {
                console.log(label + ': -> MediaFlowOutStateChange' );
            });
            rtpEp.on('MediaSessionStarted', function(response) {
                console.log(label + ': -> MediaSessionStarted' );
            });
            rtpEp.on('MediaSessionTerminated', function(response) {
                console.log(label + ': -> MediaSessionTerminated' );
            });
            rtpEp.on('MediaStateChanged', function(response) {
                console.log(label + ': -> MediaStateChanged' );
            });
        }
    } catch (e) {
        console.error(e);
    }
})();
