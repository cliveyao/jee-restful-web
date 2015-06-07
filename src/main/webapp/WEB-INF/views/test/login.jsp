<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<html>
<head>
<meta charset="utf-8">
<title>login</title>
<link href="../static/css/style.css" rel="stylesheet" type="text/css">
</head>
<body>
<img alt="JeeWS" src="../static/images/ws.png">
<label>${error }</label>
<form action="login" method="post">
    用户名：<input type="text" name="username" value=""><br/>
    密码：<input type="password" name="password"><br/>
    自动登录：<input type="checkbox" name="rememberMe" value="true"><br/>
    验证码： <input type="text" name="captcha" id="captcha"> 
    <img alt="看不清？点击更换密码" src="../static/captcha.jpg" onclick="this.src='../static/captcha.jpg?'+Math.random();"><br>
    <input type="submit" value="登录">
</form>
<%@include file="/WEB-INF/views/include/footer.html" %>        
<script>
$("#captcha").blur(function(){
    $.ajax({    
        type:'post',        
        url:'../static/validateCode',    
        data:{validateCode:$("#captcha").val()},
        cache:false,    
        dataType:'json',    
        success:function(data){    
            if(data==false)
                alert("验证码错误");
        },
        error : function() {    
            alert("异常！");    
       }
    });    
});
</script>
</body>
</html>