# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy project file and restore
COPY HrApi.csproj ./
RUN dotnet restore "HrApi.csproj"

# Copy all other source files and publish release
COPY . ./
RUN dotnet publish "HrApi.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Render dynamically injects the PORT environment variable
ENV PORT=5000
EXPOSE 5000

ENTRYPOINT ["dotnet", "HrApi.dll"]
