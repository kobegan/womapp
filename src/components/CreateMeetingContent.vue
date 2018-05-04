<template>
    <div class="page-content">
        <div class="content-nav">
            会话管理 &gt; 创建视频会话
        </div>
        <form @submit.prevent="createSession" @reset.prevent="resetSession">
            <fieldset>
                <legend>会话信息</legend>
                <table class="formtable">
                    <tbody>
                    <tr>
                        <td>类型:</td>
                        <td>
                            <select v-model="choosenSessionType">
                                <option v-for="type, index in meetingType" :value="index">{{type}}</option>
                            </select>
                        </td>
                    </tr>
                    <template v-if="choosenSessionType === 0">
                        <tr>
                            <td>视频流地址:</td>
                            <td>
                                <input type="text" v-model="streamUrl" required placeholder="rtsp://*/id=*">
                            </td>

                        </tr>
                        <tr>
                            <td>Video:</td>
                            <td>
                                <input type="checkbox" v-model="video"/>
                            </td>
                        </tr>
                        <tr>
                            <td>Audio:</td>
                            <td>
                                <input type="checkbox" v-model="audio"/>
                            </td>
                        </tr>
                    </template>

                    <template v-if="choosenSessionType === 1">
                        <tr>
                            <td>会话主题:</td>
                            <td>
                                <input id="capacity" type="text" v-model="meetingname" required placeholder="例如：流媒体" maxlength="20">
                            </td>
                        </tr>

                        <tr>
                            <td>备注：</td>
                            <td>
                                <textarea id="description" v-model="description"  maxlength="200" rows="5" cols="60" required placeholder="200字以内的文字描述"></textarea>
                            </td>
                        </tr>
                    </template>

                    <tr>
                        <td colspan="2" class="command">
                            <input type="submit" value="创建" class="clickbutton">
                            <input type="reset" value="重置" class="clickbutton">
                        </td>
                    </tr>
                    </tbody>
                </table>
            </fieldset>
        </form>
    </div>
</template>

<script>
    import axios from 'axios'
    export default  {
        name: 'create-meeting-content',
        data () {
            return {
                meetingname: '',
                description: '',
                groupId: 0,
                meetingType: ['单点视频会话', '多点视频会话', 'OneOnOne'],
                choosenSessionType: undefined,
                streamUrl: '',
                audio: false,
                video: true,
                wsConnection: null
            }
        },
        computed: {

        },
        beforeDestroy () {

        },
        created () {

        },
        methods: {

        }
    }
</script>

<style scoped>
/*    .page-content{
        width:830px;
        float:right;
    }
    .page-content .content-nav{
        padding:0 0 10px 0;
    }*/
</style>
