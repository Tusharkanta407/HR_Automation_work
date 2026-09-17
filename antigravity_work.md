--> so by deafult i am making no code tool for hr so i think i will dothe excildrsw code of ui the n use it but what i think i t is nom oackage so we will change the we are now wokring on only ui of the no code tool of hr the bg color think as a dahboad type of backgrounf the bg color is this 

Tsx code - : 
<div className="min-h-screen w-full bg-[#faf8f3] relative">
 <div
   className="absolute inset-0 z-0"
   style={{
     backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,29,61,0.12) 1px, transparent 0)`,
     backgroundSize: "16px 16px",
   }}
 />
 <div className="relative z-10">{/* Your content */}</div>
</div>
Css code - : 

<!-- Ivory Dot Sheet — ReactBD BG -->
<div class="reactbd-bg">
 <div class="reactbd-bg__layer"></div>
 <div class="reactbd-bg__content"><!-- Your content --></div>
</div>
<style>
.reactbd-bg {
 min-height: 100vh;
 width: 100%;
 position: relative;
}
.reactbd-bg__layer {
 position: absolute;
 inset: 0;
 z-index: 0;
 background: #faf8f3;
 background-image: radial-gradient(circle at 1px 1px, rgba(0,29,61,0.12) 1px, transparent 0);
 background-size: 16px 16px;
}
.reactbd-bg__content {
 position: relative;
 z-index: 1;
}
</style>


--> so this ist he dashboain the exclidrw style in the bug float the iconm section the dahboad is gull screel all the element evrything on the the bg dashboad i give teh ui clor just abouve the clean font size ui drop you can use  reactflow.dev get there code @xyflow/react whch is feel for the igueess yo have the proper product underatanding so you can do it ourt color same as the white excildrw colro like clean whit etype you can inspect there website 
--> NODE LIBRARY
│
├── TRIGGERS
│   ├── Manual Trigger
│   ├── Schedule
│   ├── Webhook
│   ├── Assessment Completed
│   └── Candidate Hired
│
├── HR DATA
│   ├── Get Employees
│   ├── Get Employee
│   ├── Get Attendance
│   ├── Get Monthly Attendance
│   ├── Get Leave Records
│   ├── Get Candidates
│   ├── Get Candidate
│   ├── Get Assessment Result
│   ├── Get Interviewers
│   └── Get Interviewer Availability
│
├── LOGIC
│   ├── Condition / IF
│   ├── Filter
│   ├── Transform Data
│   ├── Switch
│   └── Merge
│
├── ACTIONS
│   ├── Send Email
│   ├── HTTP Request
│   ├── Send Webhook
│   ├── Update Employee
│   ├── Update Candidate Status
│   ├── Assign Interviewer
│   ├── Schedule Interview
│   ├── Create Employee
│   └── Create Onboarding Task
│
└── UTILITY
    ├── Delay
    ├── Log Result
    └── Success these are the node lsit add it this 

