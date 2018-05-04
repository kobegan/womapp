<template>
    <div class="page-content">
        <div class="content-nav">
            会话管理 &gt; 查看会话
        </div>
        <table class="listtable">
            <caption>所有会话:</caption>
            <tbody>
            <tr class="listheader">
                <th>会话类型</th>
                <th>内容</th>
                <th>操作</th>
            </tr>
            <tr v-for="info in meetingInfo">
                <td>{{info.type}}</td>
                <td>{{info.desc}}</td>
                <td>
                    <router-link :to="{ name: info.type, params: { groupId: info.groupId }}">进入会话</router-link>
                </td>
            </tr>
            </tbody></table>
    </div>
</template>

<script>
    import axios from 'axios'
    export default {
        name: 'query-meeting-content',
        data () {
            return {
                meetingInfo: []
            }
        },
        beforeRouteEnter(to, from, next) {

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
