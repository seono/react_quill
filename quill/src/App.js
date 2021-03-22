import React, { Component } from "react";
import ReactQuill,{Quill} from "react-quill"
import Dropzone from "react-dropzone"
import "react-quill/dist/quill.snow.css"
import Youtube from "./static/svg/youtube.svg"
import Play from "./static/svg/play.svg";
import Film from "./static/svg/film.svg";
import "./static/css/editor.css"
const icons = Quill.import('ui/icons')
icons['mycustom'] = `<img src=${Film} alt="videoIcon" className="ql-mycustom"/>`
icons['video'] = `<img src=${Youtube} alt="youtubeIcon" className="ql-mycustom"/>`

const Image = Quill.import('formats/image'); // 커스터마이징 대상 import

class CustomImage extends Image{
  static create(value){
    const image = document.createElement('img')
    image.src = this.getUrl(value)
    image.setAttribute("style","max-height:100%;max-width:100%;")
    image.className="image_preview"
    image.setAttribute("id","ql")
    return image
  }
  static getUrl(url){
    if(url!=null) {
      if(typeof(url)==="string"){
        return url;
      }
      else return URL.createObjectURL(url);
    }
    else return null;
  }
}

CustomImage.blotName = 'image';

Quill.register("formats/image",CustomImage,false);


const Video = Quill.import('formats/video');

class CustomVideo extends Video{
  static create(value){
    const node = super.create();
    const video = document.createElement('video')
    video.setAttribute("id","ql")
    const temp = document.createElement('div')
    const embed = document.createElement('embed')
    video.setAttribute('controls',true);
    video.setAttribute('type',"video/mp4");
    video.setAttribute('controlslist','nodownload');
    video.setAttribute('tabindex',"-1");
    video.setAttribute('style',"max-height:100%;max-width:100%;postion:relative;margin:3px;");
    video.setAttribute('class',"video_preview");
    temp.setAttribute('class',"video_preview_tempData")
    node.appendChild(video);
    video.onloadeddata = (e) =>{
      if(video.videoWidth===0){
        video.removeAttribute("controls")
        node.style.backgroundColor = "#e8eae6"
        const url = document.createElement("div")
        url.setAttribute("class","video_preview_tempData_url")
        url.innerText = value.name;
        embed.src = Play
        embed.setAttribute("style","width:30px;height:30px;")
        temp.appendChild(embed)
        temp.appendChild(url);
        node.appendChild(temp)
      }
    }
    video.src = this.sanitize(value.blob==null?value:value.blob)
    return node
  }

  static value(node){
    return node.firstElementChild.getAttribute('src');
  }

  static sanitize(url){
    if(url!=null) {
      if(typeof(url)==="string"){
        return url;
      }
      else return URL.createObjectURL(url);
    }
    else return null;
  }
};

CustomVideo.blotName = 'myvideo';
CustomVideo.className = "ql-prevideo";
CustomVideo.tagName = "DIV";

Quill.register('formats/myvideo', CustomVideo, false);


const BlockEmbed = Quill.import('blots/block/embed');

class MediaBlot extends BlockEmbed{
    static create(value){
        const node = super.create();
        node.setAttribute('src',value);
        node.setAttribute('id',"ql");
        node.setAttribute('frameborder', '0');
        node.setAttribute('allow', 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture');
        node.setAttribute('allowtransparency', true);
        node.setAttribute('allowfullscreen', true);
        node.setAttribute('scrolling', '0');
        node.setAttribute('width', '100%');
        node.setAttribute('height', '315px');
        return node;
    }

    static value(node){
      return node.getAttribute('src');
    }
}

MediaBlot.blotName = "video";
MediaBlot.tagName = "iframe";
Quill.register("formats/video",MediaBlot,false);


class App extends Component {
  constructor(props) {
    super(props)
    this.state = { 
      text: '',
      open:"image/*"
    } // You can also pass a Quill Delta here
    this.handleChange = this.handleChange.bind(this)
    this.dropzone=null;
    this.quillRef=null;
    this.testRef=null;
  }
  componentDidMount(){
    const quill = this.quillRef.getEditor();      
    const tooltip = quill.theme.tooltip;
    tooltip.save = () =>{
      const url = sanitizeUrl(tooltip.textbox.value)
      if(url!=null) {
        const range = tooltip.quill.selection.savedRange
        quill.insertEmbed(range.index,'video',url,'user');
        quill.getSelection(range.index + 1)
        quill.focus();
      }
      tooltip.hide();
    }
  }
 
  handleChange(value) {
    this.setState({ text: value })
  }
  onDrop = (acceptedFiles) => {
    try {
      acceptedFiles.reduce((pacc, _file) => {
        const reader =  new FileReader();
        const quill = this.quillRef.getEditor();
        const range = quill.getSelection();
        if (_file.type.split("/")[0]==="video"){
          reader.onload = (e) =>{
            const dataURL = e.target.result;
            const blob = dataUrltoBlob(dataURL);
            const data = {blob:blob,name:_file.name}
            quill.insertEmbed(range.index,"myvideo",data);
            quill.setSelection(range.index + 1);
            quill.focus();
          }
          return reader.readAsDataURL(_file);
        }else{
          reader.onload = (e) =>{
            const dataURL = e.target.result;
            const blob = dataUrltoBlob(dataURL)
            quill.insertEmbed(range.index,"image",blob);
            quill.setSelection(range.index + 1);
            quill.focus();
          }
          return reader.readAsDataURL(_file);
        }
      },Promise.resolve());
    } catch (error) {}
  };

  imageHandler = () => {
    this.setState({
      open:"image/*"
    })
    if (this.dropzone) this.dropzone.open();
  };

  videoHandler = () => {
    this.setState({
      open:"video/*"
    })
    if (this.dropzone) this.dropzone.open();
  }

  submitHandler = () => (e) =>{
    this.testRef.innerHTML = this.quillRef.props.value;
    this.quillRef.getEditor().setContents([])
  }

  updateHandler = () => (e) =>{
    const quill = this.quillRef.getEditor();
    quill.clipboard.dangerouslyPasteHTML(this.testRef.innerHTML)
    const delta = quill.clipboard.convert(this.testRef.innerHTML)
    console.log(delta)
  }

  modules = {
    toolbar:{
      container: [
        ["image", "mycustom", "video"]
      ],
      handlers: { image : this.imageHandler,
        mycustom : this.videoHandler
      }
    }
  }

  formats = [
    "image",
    "video",
    "myvideo"
  ]
 
  render() {
    return (
      <React.Fragment>
        <div className="editor_zone">
        <ReactQuill 
          ref={(el)=>{this.quillRef = el}}
          modules={this.modules}
          formats={this.formats}
          value={this.state.text}
          onChange={this.handleChange}
          theme="snow"/>
        <button onClick={this.submitHandler()}>제출</button>
        </div>
        <div className="test_zone">
          <div ref={el => {this.testRef=el}} className="editor_content">

          </div>
          <button onClick={this.updateHandler()}>수정</button>
        </div>
        <Dropzone
          ref = {(el)=>(this.dropzone = el)}
          accept = {this.state.open}
          onDrop = {this.onDrop}
          styles={{dropzone:{width:0,height:0}}}
        >
          {({getRootProps, getInputProps}) =>(
            <section>
              <div {...getRootProps()}>
                <input {...getInputProps()}/>
              </div>
            </section>
          )}
        </Dropzone>
      </React.Fragment>
    )
  }
}

export default App;

const dataUrltoBlob = (dataURL) =>{
  var byteString = atob(dataURL.split(',')[1]);

  var mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0]

  var ab = new ArrayBuffer(byteString.length);
  var ia = new Uint8Array(ab);
  for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
  }

  return new Blob([ab], {type: mimeString});
}

const sanitizeUrl = (url) =>{
  if(typeof(url)!="string") return null;
  let match = url.match(/^(?:(https?):\/\/)?(?:(?:www|m)\.)?youtube\.com\/watch.*v=([a-zA-Z0-9_-]+)/) ||
              url.match(/^(?:(https?):\/\/)?(?:(?:www|m)\.)?youtu\.be\/([a-zA-Z0-9_-]+)/) ||
              url.match(/^.*(youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=)([^#&?]*).*/);
  if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}?showinfo=0`
  }
  if (match = url.match(/^(?:(https?):\/\/)?(?:www\.)?vimeo\.com\/(\d+)/)) { // eslint-disable-line no-cond-assign
      return (match[1] || 'https') + '://player.vimeo.com/video/' + match[2] + '/';
  }
  return null;
}