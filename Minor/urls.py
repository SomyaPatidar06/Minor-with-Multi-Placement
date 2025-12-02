"""
URL configuration for Minor project.

The `urlpatterns` list routes URLs to views.
"""
from django.contrib import admin
from django.urls import path
from . import views
from django.shortcuts import render   # <-- For test_ar view


# Simple test view for AR (you can remove if not needed later)
def test_ar(request):
    return render(request, "test_ar.html")


urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.Home),
    path('about/', views.about),
    path('service/', views.service),
    path('projects/', views.projects),
    path('contact/', views.contact),
    path('interior_design/', views.interior),
    path('walkthrough_Animation/', views.walkthrough),
    path('landscape_design/', views.landscape),
    path('elevation_design/', views.elevation),
    path('construction/', views.construction),
    path('architectural_plan/', views.architecture),
    path('register/', views.register),
    path('ar-studio/', views.ar_studio),
    path('login/', views.login),

    # New Multi Object AR Page
    path('ar-multi/', views.ar_multi, name="ar_multi"),

    # Test AR (optional)
    path('test-ar/', test_ar),
]
