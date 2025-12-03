from django.http import HttpResponse
from django.shortcuts import render
def Home (request):
    #return HttpResponse("welcome home")
    return render(request,'home.html')

def about (request):
    #return HttpResponse("welcome")
    return render(request,'about.html')

def service (request):
    #return HttpResponse("welcome")
    return render(request,'service.html')
def projects (request):
    return render(request,'projects.html')

def login(request):
    return render (request,'login.html')
def contact (request):
    return render(request,'contact.html')
def interior (request):
    return render(request,'interior.html')
def architecture (request):
    return render(request,'architecture.html')
def landscape (request):
    return render(request,'landscape.html')
def elevation (request):
    return render(request,'elevation.html')
def construction (request):
    return render(request,'construction.html')
def walkthrough (request):
    return render(request,'walkthrough.html')
def register (request):
    return render(request,'register.html')
def login (request):
    return render(request,'login.html')   
def ar_studio(request):
    return render(request, 'ar_studio.html')
from django.shortcuts import render

def ar_multi(request):
    return render(request, "ar_multi.html")
