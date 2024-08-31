'use strict';

function SrsRtcPublisherAsync() {
    var self = {};

    // https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
    self.constraints = {
        audio: {
            autoGainControl: false,
            channelCount: 1,
            echoCancellation: true,
            latency: 0,
            noiseSuppression: true,
            sampleRate: 44100,
            sampleSize: 8,
            volume: 1.0
        },
        video: true,
    };

    self.publish = async function (url) {

        // 1. Определил conf вручную и избавился полностью от кода с self.__internal
        // Можно было не передавать в POST запросе в параметре data поля: api, tid, clientip

        // Было так:
        // var conf = self.__internal.prepareUrl(url);

        // Стало так:
        // let conf = {
        //     apiUrl: window.location.origin + "/rtc/v1/publish/", // (где window.location.origin - хост медиа сервера)
        //     streamUrl: url,
        // }

        self.pc.addTransceiver("audio", {direction: "sendonly"});
        self.pc.addTransceiver("video", {direction: "sendonly"});

        var stream = await navigator.mediaDevices.getUserMedia(self.constraints);

        // @see https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/addStream#Migrating_to_addTrack
        stream.getTracks().forEach(function (track) {
            self.pc.addTrack(track);

            // Notify about local track when stream is ok.
            self.ontrack && self.ontrack({track: track});
        });

        var offer = await self.pc.createOffer();
        await self.pc.setLocalDescription(offer);

        // 2 шаг. Был POST запрос
        // var session = await new Promise(function (resolve, reject) {
        //     // @see https://github.com/rtcdn/rtcdn-draft
        //     var data = {
        //         //api: conf.apiUrl,
        //         //tid: conf.tid,
        //         streamurl: conf.streamUrl,
        //         //clientip: null,
        //         sdp: offer.sdp
        //     };
        //     console.log("Generated offer: ", data);
        //
        //     $.ajax({
        //         type: "POST",
        //         url: conf.apiUrl,
        //         data: JSON.stringify(data),
        //         contentType: 'application/json',
        //         dataType: 'json'
        //     }).done(function (data) {
        //         console.log("Got answer: ", data);
        //         if (data.code) {
        //             reject(data);
        //             return;
        //         }
        //
        //         resolve(data);
        //     }).fail(function (reason) {
        //         reject(reason);
        //     });
        // });

        let userId = parseInt($('#txt_userId').val());

        // Стало по сокету, возвращается тот же ответ как и при POST запросе
        let session = await sig.send({
            action: 'streamPublish',
            room: $('#txt_room').val(),
            userId: userId,
            sdp: offer.sdp
        });

        console.log('streamPublish');
        console.log(userId + ': ' + url);
        console.log("Got answer (from ws): ", session);

        await self.pc.setRemoteDescription(
            new RTCSessionDescription({type: 'answer', sdp: session.sdp})
        );

        return session;
    };

    // Close the publisher.
    self.close = function () {
        self.pc && self.pc.close();
        self.pc = null;
    };

    // The callback when got local stream.
    // @see https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/addStream#Migrating_to_addTrack
    self.ontrack = function (event) {
        // Add track to stream of SDK.
        self.stream.addTrack(event.track);
    };

    self.pc = new RTCPeerConnection(null);

    // To keep api consistent between player and publisher.
    // @see https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/addStream#Migrating_to_addTrack
    // @see https://webrtc.org/getting-started/media-devices
    self.stream = new MediaStream();

    return self;
}

function SrsRtcPlayerAsync() {
    var self = {};

    self.play = async function(url) {

        // 1. Определил conf вручную и избавился полностью от кода с self.__internal
        // Можно было не передавать в POST запросе в параметре data поля: api, tid, clientip

        // Было так:
        // var conf = self.__internal.prepareUrl(url);

        // Стало так:
        // let conf = {
        //     apiUrl: window.location.origin + "/rtc/v1/play/", // (где window.location.origin - хост медиа сервера)
        //     streamUrl: url,
        // }

        self.pc.addTransceiver("audio", {direction: "recvonly"});
        self.pc.addTransceiver("video", {direction: "recvonly"});

        var offer = await self.pc.createOffer();
        await self.pc.setLocalDescription(offer);

        // 2 шаг. Был POST запрос
        // var session = await new Promise(function(resolve, reject) {
        //     // @see https://github.com/rtcdn/rtcdn-draft
        //     var data = {
        //         //api: conf.apiUrl,
        //         //tid: conf.tid,
        //         streamurl: conf.streamUrl,
        //         //clientip: null,
        //         sdp: offer.sdp
        //     };
        //     console.log("Generated offer: ", data);
        //
        //     $.ajax({
        //         type: "POST",
        //         url: conf.apiUrl,
        //         data: JSON.stringify(data),
        //         contentType:'application/json',
        //         dataType: 'json'
        //     }).done(function(data) {
        //         console.log("Got answer: ", data);
        //         if (data.code) {
        //             reject(data); return;
        //         }
        //         resolve(data);
        //     }).fail(function(reason){
        //         reject(reason);
        //     });
        // });

        let userId = parseInt($('#txt_userId').val());
        let participantId = parseInt(url.split('/').pop());

        // Стало по сокету, возвращается тот же ответ как и при POST запросе
        let session = await sig.send({
            action: 'streamPlay',
            room: $('#txt_room').val(),
            userId: userId,
            sdp: offer.sdp,
            participantId: participantId,
        });

        console.log('streamPlay');
        console.log(userId + ': ' + url);
        console.log(participantId + ': ' + url);
        console.log("Got answer (from ws): ", session);

        await self.pc.setRemoteDescription(
            new RTCSessionDescription({type: 'answer', sdp: session.sdp})
        );

        return session;
    };

    // Close the player.
    self.close = function() {
        self.pc && self.pc.close();
        self.pc = null;
    };

    // The callback when got remote track.
    // Note that the onaddstream is deprecated, @see https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/onaddstream
    self.ontrack = function (event) {
        // https://webrtc.org/getting-started/remote-streams
        self.stream.addTrack(event.track);
    };

    self.pc = new RTCPeerConnection(null);

    // Create a stream to add track to the stream, @see https://webrtc.org/getting-started/remote-streams
    self.stream = new MediaStream();

    // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/ontrack
    self.pc.ontrack = function(event) {
        if (self.ontrack) {
            self.ontrack(event);
        }
    };

    return self;
}

