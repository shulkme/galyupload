<?php
header('content-type:text/html charset:utf-8');
echo json_encode(_upload_file("fileData","upload/",200));
function _upload_file($_input_name,$_upload_path,$_file_max_size){
   if ((($_FILES[$_input_name]["type"] == "image/gif")|| ($_FILES[$_input_name]["type"] == "image/jpeg")|| ($_FILES[$_input_name]["type"] == "image/bmp")|| ($_FILES[$_input_name]["type"] == "image/jpeg")||($_FILES[$_input_name]["type"] == "image/png")||($_FILES[$_input_name]["type"] == "image/svg")||($_FILES[$_input_name]["type"] == "image/ico"))&& ($_FILES[$_input_name]["size"] < ($_file_max_size*10000))){  
        if ($_FILES[$_input_name]["error"] > 0){  
                $data= array('status'=>101,'error'=>$_FILES[$_input_name]['error']);
                return $data;
            }else{  
                //自定义文件名称  
                $array=$_FILES[$_input_name]["type"];  
                $array=explode("/",$array);  
                $newfilename= sha1($_FILES[$_input_name]["name"].date('y-m-d h:i:s',time()));
                $_FILES[$_input_name]["name"]=$newfilename.".".$array[1];  
                if (@!is_dir($_upload_path)){ 
                    //当路径不存在  
                    mkdir($_upload_path);//创建路径  
                }  
                $url=$_upload_path;//记录路径  
                if (file_exists($url.$_FILES[$_input_name]["name"])){  
                    //当文件存在
                    $data= array("status"=>101,'error'=>$_FILES[$_input_name]["name"]+"该文件已存在！");
                    return $data;
                }else{  
                //当文件不存在  
                    $url=$url.$_FILES[$_input_name]["name"];  
                    move_uploaded_file($_FILES[$_input_name]["tmp_name"],$url);
                    $data= array('status'=>100,'error'=>"文件上传成功！");
                    return $data;
                }  
            }  
    }else{  
       $data= array('status'=>101,'error'=>"上传的文件不符合要求！");
       return $data;
    }
}
?>