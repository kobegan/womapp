<template>
    <div id = "callPage" class = "call-page">
        <video id = "remoteVideo" autoplay></video>

        <div class = "row text-center">
            <div class = "col-md-12">
                <label>
                    <input type="checkbox" v-model="videoCheck" value="video"/>
                    接收视频</label><br>
                <label>
                    <input type="checkbox" v-model="audioCheck" value="audio"/>
                    接收音频</label><br>
                <button id = "callBtn" class = "btn-success btn" @click="createOffer">Call</button>
                <button id = "hangUpBtn" class = "btn-danger btn" @click="handUp">Hang Up</button>
            </div>
        </div>

    </div>
</template>

<script>
    import HttpWsConnection from '@/js/httpws/httpWsConnection'
    import axios from 'axios'
    import {wsConnection,info, hostname, port} from '@/js/connection'
    import trace from '@/js/logging'
    export default {
        name: 'meeting-view',
        data() {
            return {
                groub_id: 0,
                peer_connection: null,
                endpoint_id: null,
                endpoint: null,
                videoCheck: false,
                audioCheck: false
            }
        },
        computed: {
            getSignalingServer () {
                return this.$store.getters.getSignalingServer
            }
        },
        created() {
            this.endpoint_id = Math.floor(Math.random()*1000);
            console.log('creatd endpoint_id: ' + this.endpoint_id);
            this.group_id = this.$route.params.groupId;
            this.createEndpoint();
        },
        beforeCreate() {
            console.log('beforeCreate groupid: '+ this.$route.params.groupId);
        },
        methods: {
            createEndpoint() {

                let signalingServer = `${this.getSignalingServer[0]}/endpoint${this.endpoint_id}`;

                this.endpoint = new HttpWsConnection(signalingServer);
                let self = this;
                this.endpoint.onConnected = function () {
                    console.log(`${self.endpoint_id} connected to the signalling server!`);
                    self.endpoint.addServiceListener(self.serviceListenerCallback);
                    self.joinGroup();
                    self.createMPEndpoint();
                };
            },
            createMPEndpoint() {
                axios.post(`/mpendpoint/${this.group_id}/${this.endpoint_id}`)
                    .then(function (response) {
                        console.log(response);
                    })
                    .catch(function (error) {
                        console.log(error);
                    });
            },
            serviceListenerCallback(req, res) {
                console.log('serviceListenerCallback:\r\n' + req._bodyText);
                let data;
                try {
                    data = JSON.parse(req._bodyText);
                } catch(err) {
                    console.log(err.message)
                }
                if(data.state) {
                    console.log(data.state);
                } else {
                    switch(data.type) {
                        //when somebody wants to call us
                        case "offer":
                            this.handleOffer(data.offer);
                            break;
                        case "answer":
                            this.handleAnswer(data.answer);
                            break;
                        //when a remote peer sends an ice candidate to us
                        case "candidate":
                            this.handleCandidate(data.candidate);
                            break;
                        case "leave":
                            this.handleLeave();
                            break;
                        default:
                            break;
                    }
                }
            },
            joinGroup () {
                const options = {
                    method: 'post',
                    path: `/signalling-bridge/join/${this.group_id}/${this.endpoint_id}`
                };
                let self = this;
                let request_client = this.endpoint.createClientRequest(options, res => {
                        if(res.ok) {
                        self.handleJoin();
                    } else {
                        console.log(res.statusText);
                    }
                });
                request_client.write(JSON.stringify({"prefix":"/pipeline/1","type":`Endpoint`}));
                request_client.end();
            },
            handleJoin() {

                this.peer_connection = new RTCPeerConnection(null);

                //when a remote user adds a stream to the peer connection, we display it
                this.peer_connection.ontrack = (e) => {
                    let remoteVideo = document.getElementById('remoteVideo');
                    if (remoteVideo.srcObject !== e.streams[0]) {
                        remoteVideo.srcObject = e.streams[0];
                        trace('received remote stream');
                    }
                };
                let self = this;
                // Setup ice handling
                this.peer_connection.onicecandidate = function (event) {
                    if (event.candidate) {
                        const options = {
                            method: 'post',
                            path: `/signalling-bridge/media-description/${self.group_id}/${self.endpoint_id}`
                        };
                        let request_client = self.endpoint.createClientRequest(options, res => {
                            if(res.ok) {
                                console.log('onicecandidate ok:' + res.statusText);
                            } else {
                                console.log('onicecandidate error:' + res.statusText);
                            }
                        });
                        request_client.write(JSON.stringify({
                            type: "candidate",
                            candidate: event.candidate
                        }));
                        request_client.end();
                    }

                };
                this.peer_connection.oniceconnectionstatechange = function(event) {
                    trace('ICE state: ' + self.peer_connection.iceConnectionState);
                    console.log('ICE state change event: ', event);
                };

            },
            handleOffer(desc) {
                this.peer_connection.setRemoteDescription(desc).then(
                    function() {
                        onSetRemoteSuccess();
                    },
                    onSetSessionDescriptionError
                );

                function onSetRemoteSuccess() {
                    trace('setRemoteDescription complete');
                    trace('createAnswer start');
                    this.peer_connection.createAnswer().then(
                        onCreateAnswerSuccess,
                        onCreateSessionDescriptionError
                    );
                }

                function onCreateAnswerSuccess(desc) {
                    this.peer_connection.setLocalDescription(desc).then(
                        () => {
                            trace('setLocalDescription complete');
                            const options = {
                                method: 'post',
                                path: `/signalling-bridge/media-description/${self.group_id}/${self.endpoint_id}`
                            };
                            let request_client = self.endpoint.createClientRequest(options, res => {
                                if(res.ok) {
                                    console.log('handleOffer:' + res.statusText);
                                } else {
                                    console.log('handleOffer:' + res.statusText);
                                }
                            });
                            request_client.write(JSON.stringify({
                                type: "answer",
                                answer: desc
                            }));
                            request_client.end();
                        }, function onCreateSessionDescriptionError(error) {
                            trace('Failed to create session description: ' + error.toString());
                        }
                    );
                }
                function onSetSessionDescriptionError(error) {
                    trace('Failed to set session description: ' + error.toString());
                }
            },
            //when we got an answer from a remote user
            handleAnswer(answer) {
                this.peer_connection.setRemoteDescription(answer);
            },
            //when we got an ice candidate from a remote user
            handleCandidate(candidate) {
                this.peer_connection.addIceCandidate(candidate);
            },
            createOffer() {
                let self = this;
                // create an offer
                let offerOptions = {
                    offerToReceiveAudio: this.audioCheck,
                    offerToReceiveVideo: this.videoCheck
                };
                this.peer_connection.createOffer(
                    offerOptions
                ).then(
                    onCreateOfferSuccess,
                    onCreateSessionDescriptionError
                );

                function onCreateOfferSuccess(desc) {
                    trace('CreateOfferSuccess:\n' + desc.sdp);
                    self.peer_connection.setLocalDescription(desc).then(
                        () => {
                        trace('setLocalDescription complete');
                        const options = {
                            method: 'post',
                            path: `/signalling-bridge/media-description/${self.group_id}/${self.endpoint_id}`
                        };
                        let request_client = self.endpoint.createClientRequest(options, res => {
                            if(res.ok) {
                                console.log('createOffer:' + res.statusText);
                            } else {
                                console.log('createOffer:' + res.statusText);
                            }
                        });
                        request_client.write(JSON.stringify({
                            type: "offer",
                            offer: desc
                        }));
                        request_client.end();
                    }, onCreateSessionDescriptionError
                    );
                }
                function onCreateSessionDescriptionError(error) {
                    trace('Failed to create session description: ' + error.toString());
                }
            },
            handUp() {
                const options = {
                    method: 'delete',
                    path: `/signalling-bridge/join/${this.group_id}/${this.endpoint_id}`
                };
                let request_client = this.endpoint.createClientRequest(options, res => {
                    if(res.ok) {
                        console.log('handUp:' + res.statusText);
                    } else {
                        console.log('handUp:' + res.statusText);
                    }
                });
                request_client.end();
                this.handleLeave();
            },
            handleLeave() {
                document.querySelector('#remoteVideo').srcObject = null;
                this.peer_connection.close();
                this.peer_connection = null;
            }
        }
    }
</script>

<style scoped>
    body {
        background: #eee;
        padding: 5% 0;
    }

    video {
        background: black;
        border: 1px solid gray;
    }

    .call-page {
        position: relative;
        display: block;
        margin: 0 auto;
        width: 500px;
        height: 500px;
    }

    #remoteVideo {
        width: 500px;
        height: 500px;
    }

    .btn-success {
        color: #fff;
        background-color: #5cb85c;
        border-color: #4cae4c;
    }
    .btn-success:focus,
    .btn-success.focus {
        color: #fff;
        background-color: #449d44;
        border-color: #255625;
    }
    .btn-success:hover {
        color: #fff;
        background-color: #449d44;
        border-color: #398439;
    }

    .btn-danger {
        color: #fff;
        background-color: #d9534f;
        border-color: #d43f3a;
    }
    .btn-danger:focus,
    .btn-danger.focus {
        color: #fff;
        background-color: #c9302c;
        border-color: #761c19;
    }
    .btn-danger:hover {
        color: #fff;
        background-color: #c9302c;
        border-color: #ac2925;
    }
</style>
