import{f as t,j as e,L as r}from"./index-C84Adblg.js";import{c as i,S as d}from"./Footer-CqPygwjL.js";/**
 * @license lucide-react v0.498.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const l=[["path",{d:"M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2",key:"5owen"}],["circle",{cx:"7",cy:"17",r:"2",key:"u2ysq9"}],["path",{d:"M9 17h6",key:"r8uit2"}],["circle",{cx:"17",cy:"17",r:"2",key:"axvx0g"}]],o=i("car",l);/**
 * @license lucide-react v0.498.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const h=[["rect",{width:"7",height:"9",x:"3",y:"3",rx:"1",key:"10lvy0"}],["rect",{width:"7",height:"5",x:"14",y:"3",rx:"1",key:"16une8"}],["rect",{width:"7",height:"9",x:"14",y:"12",rx:"1",key:"1hutg5"}],["rect",{width:"7",height:"5",x:"3",y:"16",rx:"1",key:"ldoo1y"}]],x=i("layout-dashboard",h);/**
 * @license lucide-react v0.498.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const m=[["path",{d:"M7.9 20A9 9 0 1 0 4 16.1L2 22Z",key:"vv11sd"}]],y=i("message-circle",m),v=[{label:"Dashboard",href:"/admin/dashboard",icon:x},{label:"Vehicles",href:"/admin/vehicles",icon:o},{label:"Inquiries",href:"/admin/inquiries",icon:y},{label:"Account",href:"/account",icon:d}];function u(){const a=t();return e.jsxs("aside",{className:"admin-sidebar",children:[e.jsx("div",{className:"sidebar-brand",children:e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:12},children:[e.jsx("img",{src:"/assets/tnl-logo.png",alt:"TNL Motors",style:{width:56,height:"auto"}}),e.jsxs("div",{children:[e.jsx("div",{style:{fontWeight:800},children:"TNL MOTORS"}),e.jsx("div",{className:"brand-sub",children:"Automotive Management"})]})]})}),e.jsx("nav",{className:"sidebar-links",children:v.map(({label:c,href:s,icon:n})=>e.jsxs(r,{to:s,className:`sidebar-link ${a.pathname===s?"active":""}`,children:[e.jsx(n,{size:18}),e.jsx("span",{className:"link-text",children:c})]},s))}),e.jsx("div",{className:"sidebar-footer",children:e.jsxs("div",{className:"sidebar-profile",children:[e.jsx("div",{className:"profile-initials",children:"AM"}),e.jsxs("div",{children:[e.jsx("strong",{children:"Admin"}),e.jsx("div",{className:"small-text",children:"Manage account"})]})]})})]})}export{u as A,o as C};
